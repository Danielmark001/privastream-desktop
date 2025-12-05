"""
Processing service - orchestrates frame processing workflow.
Main business logic for frame detection, blurring, and content safety.
"""
from typing import Tuple, List, Dict, Any, Optional
import numpy as np
import cv2
import base64
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor

from core.logging import get_logger
from core.errors import ValidationError, AppError, ErrorCode
from config.settings import Settings
from .detector_service import DetectorService
from .room_service import RoomService
from .cache_service import CacheService
from .metrics_service import MetricsService
from .content_safety_service import ContentSafetyService
from .copyright_service import CopyrightService

logger = get_logger(__name__)


class ProcessingService:
    """
    Service for processing video frames.

    Orchestrates detection, blurring, caching, metrics, and safety checks.
    """

    def __init__(
        self,
        settings: Settings,
        detector_service: DetectorService,
        room_service: RoomService,
        cache_service: CacheService,
        metrics_service: MetricsService,
        content_safety_service: Optional[ContentSafetyService] = None,
        copyright_service: Optional[CopyrightService] = None,
    ):
        """
        Initialize processing service.

        Args:
            settings: Application settings
            detector_service: Detector service instance
            room_service: Room service instance
            cache_service: Cache service instance
            metrics_service: Metrics service instance
            content_safety_service: Content safety service instance
            copyright_service: Copyright service instance
        """
        self.settings = settings
        self.detector = detector_service
        self.rooms = room_service
        self.cache = cache_service
        self.metrics = metrics_service
        self.content_safety = content_safety_service
        self.copyright = copyright_service

        # Thread pool for async encoding and CPU-bound tasks
        self.encoding_executor = ThreadPoolExecutor(
            max_workers=settings.performance.encoding_workers,
            thread_name_prefix="encoder"
        )
        
        # Thread pool for heavy model inference (Safety/Copyright) to avoid blocking event loop
        self.model_executor = ThreadPoolExecutor(
            max_workers=4, 
            thread_name_prefix="model_worker"
        )

    def decode_frame(self, frame_data: str) -> np.ndarray:
        """
        Decode base64 frame data to numpy array.

        Args:
            frame_data: Base64-encoded image data

        Returns:
            Decoded frame as numpy array

        Raises:
            ValidationError: If frame data is invalid
        """
        try:
            # Remove data URL prefix if present
            if frame_data.startswith('data:image'):
                frame_data = frame_data.split(',', 1)[1]

            # Decode base64
            img_bytes = base64.b64decode(frame_data)
            img_array = np.frombuffer(img_bytes, dtype=np.uint8)
            frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

            if frame is None:
                raise ValidationError("Failed to decode image data", field="frame")

            return frame

        except Exception as e:
            logger.error(f"Frame decoding failed: {e}")
            raise ValidationError(f"Invalid image data: {str(e)}", field="frame")

    def encode_frame(self, frame: np.ndarray) -> str:
        """
        Encode frame to base64 JPEG.

        Args:
            frame: Input frame

        Returns:
            Base64-encoded JPEG string
        """

        # Encode with aggressive quality (20) for maximum FPS with T4 GPU
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 20]
        _, buffer = cv2.imencode('.jpg', frame, encode_param)
        frame_b64 = base64.b64encode(buffer).decode('utf-8')
        return f"data:image/jpeg;base64,{frame_b64}"

    async def process_frame_async(
        self,
        frame: np.ndarray,
        frame_id: int = 0,
        room_id: Optional[str] = None,
        blur_only: bool = False,
        provided_rectangles: Optional[List[Dict[str, Any]]] = None,
        audio_chunk: Optional[bytes] = None,
        enable_safety: bool = True,
        enable_copyright: bool = True,
        active_models: Optional[List[str]] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Process a single frame asynchronously with parallel execution.

        Args:
            frame: Input frame (BGR format)
            frame_id: Frame sequence number
            room_id: Optional room ID for whitelist lookup
            blur_only: Skip detection, only blur provided rectangles
            provided_rectangles: Pre-detected rectangles for blur-only mode
            audio_chunk: Optional audio bytes for copyright check
            enable_safety: Whether to run content safety checks
            enable_copyright: Whether to run copyright checks
            active_models: Optional list of models to run (e.g. ["face", "pii"])

        Returns:
            Tuple of (encoded_frame, metadata)
        """
        start_time = time.time()
        loop = asyncio.get_running_loop()
        
        # 1. Define Tasks
        tasks = []
        
        # Task A: Face Detection & Blurring (Main Priority)
        # We run this in the thread pool if it's CPU bound, or directly if it uses GPU/async
        # For now, assuming detector is CPU/GPU hybrid but blocking, so we offload it.
        tasks.append(
            loop.run_in_executor(
                self.model_executor,
                self._run_detection_pipeline,
                frame.copy(), # Copy frame to avoid race conditions
                frame_id,
                room_id,
                blur_only,
                provided_rectangles,
                active_models
            )
        )

        # Task B: Content Safety (YOLO/OCR) - HEAVY
        # Optimization: Only run every 30 frames (approx 1 sec)
        if enable_safety and self.content_safety and (frame_id % 30 == 0):
            tasks.append(
                loop.run_in_executor(
                    self.model_executor,
                    self.content_safety.analyze_frame,
                    frame.copy()
                )
            )
        else:
            # Return previous result or empty if skipped
            # In a real app, we'd cache the last known "unsafe" state for X seconds
            tasks.append(self._dummy_task({"is_safe": True, "skipped": True}))

        # Task C: Copyright (Audio)
        # Optimization: Only run every 150 frames (~5 sec) or when audio buffer is full
        if enable_copyright and self.copyright and audio_chunk and (frame_id % 150 == 0):
            tasks.append(
                loop.run_in_executor(
                    self.model_executor,
                    self.copyright.analyze_audio,
                    audio_chunk
                )
            )
        else:
            tasks.append(self._dummy_task({"detected": False, "skipped": True}))

        # 2. Execute Parallel Tasks
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 3. Unpack Results
        detection_result = results[0]
        safety_result = results[1]
        copyright_result = results[2]

        # Handle exceptions
        if isinstance(detection_result, Exception):
            logger.error(f"Detection failed: {detection_result}")
            raise detection_result
            
        blurred_frame, rectangles = detection_result
        
        # Encode for API response
        encoded_frame = self.encode_frame(blurred_frame)
        
        if isinstance(safety_result, Exception):
            logger.error(f"Safety check failed: {safety_result}")
            safety_result = {"is_safe": True, "error": str(safety_result)}
            
        if isinstance(copyright_result, Exception):
            logger.error(f"Copyright check failed: {copyright_result}")
            copyright_result = {"detected": False, "error": str(copyright_result)}

        # 4. Record Metrics & Logs
        processing_time = (time.time() - start_time) * 1000
        self.metrics.record_frame_time(processing_time)

        logger.info(
            f"Frame {frame_id} processed async",
            extra={
                "frame_id": frame_id,
                "time_ms": round(processing_time, 2),
                "detections": len(rectangles),
                "unsafe": not safety_result.get("is_safe", True),
                "copyright": copyright_result.get("detected", False)
            }
        )

        # 5. Construct Metadata
        metadata = {
            "frame_id": frame_id,
            "processing_time_ms": processing_time,
            "detections": rectangles,
            "content_safety": safety_result,
            "copyright": copyright_result
        }

        return encoded_frame, metadata

    def _run_detection_pipeline(
        self, 
        frame: np.ndarray, 
        frame_id: int, 
        room_id: Optional[str], 
        blur_only: bool, 
        provided_rectangles: Optional[List[Dict[str, Any]]],
        active_models: Optional[List[str]] = None
    ) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """Helper to run the standard detection/blurring pipeline synchronously."""
        
        # Check cache first
        if not blur_only and self.settings.performance.enable_frame_caching:
            frame_hash = self.cache.compute_hash(frame, room_id)
            cached_result = self.cache.get(frame_hash)
            if cached_result:
                # Cache stores encoded frame, so we must decode it to maintain signature
                decoded_cached = self.decode_frame(cached_result[1])
                return decoded_cached, cached_result[0] # (frame, rects)

        # Get whitelist
        whitelist_embedding = None
        if room_id and self.rooms.has_whitelist(room_id):
            whitelist_embedding = self.rooms.get_whitelist(room_id)

        # Detect/Blur
        if blur_only and provided_rectangles:
            blurred_frame = self.detector.apply_blur_only(frame, provided_rectangles)
            rectangles = provided_rectangles
        else:
            blurred_frame, rectangles = self.detector.detect_and_blur(frame, whitelist_embedding, active_models=active_models)

        # Privacy Zones
        if room_id:
            privacy_zones = self.rooms.get_privacy_zones(room_id)
            if privacy_zones:
                blurred_frame = self._apply_privacy_zones(blurred_frame, privacy_zones)

        # Encode
        # Refactor: Return raw frame to allow caller to decide on encoding
        # encoded_frame = self.encode_frame(blurred_frame)

        # Cache
        if not blur_only and self.settings.performance.enable_frame_caching:
            # We still need to cache the encoded version or raw? 
            # Caching raw is memory heavy. Caching encoded is CPU heavy to decode.
            # Let's cache encoded for the API use case.
            encoded_for_cache = self.encode_frame(blurred_frame)
            self.cache.put(frame_hash, rectangles, encoded_for_cache)

        return blurred_frame, rectangles

    async def _dummy_task(self, result: Any) -> Any:
        """Helper for conditional tasks."""
        return result

    def _apply_privacy_zones(
        self,
        frame: np.ndarray,
        zones: List[Any],  # List[PrivacyZone]
    ) -> np.ndarray:
        """
        Apply static privacy zones to frame.

        Args:
            frame: Input frame
            zones: List of privacy zones

        Returns:
            Frame with privacy zones blurred
        """
        result = frame.copy()

        for zone in zones:
            x1, y1, x2, y2 = zone.region
            region = result[y1:y2, x1:x2]

            if zone.shape == "rectangle":
                # Apply Gaussian blur
                ksize = zone.blur_strength
                if ksize % 2 == 0:  # Ensure odd kernel size
                    ksize += 1
                region = cv2.GaussianBlur(region, (ksize, ksize), 0)

            elif zone.shape == "ellipse":
                # Create ellipse mask
                mask = np.zeros(region.shape[:2], dtype=np.uint8)
                center = ((x2 - x1) // 2, (y2 - y1) // 2)
                axes = (center[0], center[1])
                cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)

                # Blur region
                ksize = zone.blur_strength
                if ksize % 2 == 0:
                    ksize += 1
                blurred = cv2.GaussianBlur(region, (ksize, ksize), 0)

                # Apply mask
                region = np.where(mask[:, :, None] == 255, blurred, region)

            result[y1:y2, x1:x2] = region

        return result

    def check_request_age(self, request_timestamp: int) -> bool:
        """
        Check if request is too old to process.

        Args:
            request_timestamp: Request timestamp in milliseconds

        Returns:
            True if request is fresh, False if stale
        """
        if not self.settings.queue.enable_request_dropping:
            return True

        current_time = int(time.time() * 1000)
        age_ms = current_time - request_timestamp
        max_age = self.settings.queue.max_request_age_ms

        if age_ms > max_age:
            logger.warning(
                f"Request too old: {age_ms}ms (max: {max_age}ms)",
                extra={"age_ms": age_ms, "max_age_ms": max_age}
            )
            self.metrics.record_frame_dropped("stale_request")
            return False

        return True

    def can_process_request(self) -> bool:
        """
        Check if we can accept another request.

        Returns:
            True if request can be processed, False if queue is full
        """
        active = self.metrics.get_active_requests()
        max_concurrent = self.settings.queue.max_concurrent_requests

        if active >= max_concurrent:
            logger.warning(
                f"Too many concurrent requests: {active}/{max_concurrent}",
                extra={"active": active, "max": max_concurrent}
            )
            self.metrics.record_frame_dropped("queue_full")
            return False

        return True

    def shutdown(self) -> None:
        """
        Shutdown the processing service and clean up resources.

        This method should be called when the service is no longer needed
        to properly release ThreadPoolExecutor and other resources.
        """
        try:
            logger.info("Shutting down ProcessingService...")

            # Shutdown thread pool executors
            if hasattr(self, 'encoding_executor') and self.encoding_executor is not None:
                self.encoding_executor.shutdown(wait=True)
            
            if hasattr(self, 'model_executor') and self.model_executor is not None:
                self.model_executor.shutdown(wait=True)

            logger.info("ProcessingService shutdown complete")
        except Exception as e:
            logger.error(f"Error during ProcessingService shutdown: {e}", exc_info=True)
