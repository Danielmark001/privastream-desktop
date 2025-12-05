"""
Unified interface for all blur detection models.
Demonstrates how to use the refactored face, PII, and plate detection models.
"""
import os
import sys
import time
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional, Union
import numpy as np
import cv2

import asyncio
import concurrent.futures
from threading import Lock
from video_models.motion_tracker import MotionTracker

# Add model directories to path
sys.path.append(str(Path(__file__).parent / "face_blur"))
sys.path.append(str(Path(__file__).parent / "pii_blur"))
sys.path.append(str(Path(__file__).parent / "plate_blur"))

try:
    from .face_detector_mediapipe import FaceDetector
    print("[INFO] Using MediaPipe FaceDetector (BlazeFace) - Lightweight & Robust")
except ImportError as e:
    print(f"[WARN] MediaPipe FaceDetector not available: {e}")
    try:
        from .yunet_face_detector import YuNetFaceDetector as FaceDetector
        print("[INFO] Using YuNet FaceDetector as fallback")
    except ImportError as e2:
        print(f"[WARN] YuNet FaceDetector not available: {e2}")
        try:
            from .face_detector import FaceDetector
            print("[INFO] Using InsightFace FaceDetector as fallback")
        except ImportError as e3:
            print(f"[WARN] InsightFace FaceDetector also not available: {e3}")
            FaceDetector = None

try:
    from pii_detector_paddle import PIIDetector
except ImportError as e:
    print(f"[WARN] PIIDetector not available: {e}")
    PIIDetector = None

try:
    from plate_detector_cpu import PlateDetectorCPU as PlateDetector
except ImportError as e:
    print(f"[WARN] PlateDetector not available: {e}")
    PlateDetector = None


class UnifiedBlurDetector:
    """
    Unified interface for all blur detection models.
    Processes frames and returns regions to be blurred from multiple models.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the unified detector.

        Args:
            config: Configuration dictionary with model-specific settings
        """
        self.config = config or {}
        self.models = {}
        self.model_locks = {}
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=3)

        # Motion tracking for fast-moving objects (per-room, per-type)
        self.room_trackers = {}  # room_id -> {model_type -> MotionTracker}
        self.enable_motion_tracking = True

        # Initialize enabled models
        self._init_models()

        print(f"[UnifiedDetector] Motion tracking enabled: {self.enable_motion_tracking}")
    
    def _init_models(self):
        """Initialize the detection models based on configuration."""
        # Face detector
        if self.config.get("enable_face", True) and FaceDetector is not None:
            try:
                face_config = self.config.get("face", {})

                # Try different initialization patterns based on detector type
                try:
                    # MediaPipe FaceDetector (now the primary choice)
                    # It uses the same interface as InsightFace wrapper now
                    self.models["face"] = FaceDetector(
                        embed_path=face_config.get("embed_path", "video_models/face_blur/whitelist/creator_embedding.json"),
                        gpu_id=face_config.get("gpu_id", 0),
                        det_size=face_config.get("det_size", 640),
                        threshold=face_config.get("threshold", 0.45),
                        dilate_px=face_config.get("dilate_px", 12),
                        smooth_ms=face_config.get("smooth_ms", 300)
                    )
                    print("[UnifiedDetector] MediaPipe Face Detector initialized with robust smoothing")
                except TypeError as e:
                    print(f"[UnifiedDetector] Standard init failed ({e}), trying fallbacks...")
                    # Fallback for other detectors if MediaPipe init failed or wasn't the loaded class
                    try:
                        # YuNet / InsightFace style
                        self.models["face"] = FaceDetector(
                            model_path=face_config.get("model_path", None),
                            input_size=face_config.get("input_size", (1280, 720)),
                            conf_threshold=face_config.get("threshold", 0.6),
                            nms_threshold=face_config.get("nms_threshold", 0.3)
                        )
                        print("[UnifiedDetector] Face Detector initialized (fallback style)")
                    except TypeError:
                         # Simple init
                        self.models["face"] = FaceDetector()
                        print("[UnifiedDetector] Face Detector initialized (simple style)")

                self.model_locks["face"] = Lock()
                print("[UnifiedDetector] Face detector ready")
            except Exception as e:
                print(f"[UnifiedDetector][WARN] Face detector initialization failed: {e}")
        
        # PII detector
        if self.config.get("enable_pii", True) and PIIDetector is not None:
            try:
                pii_config = self.config.get("pii", {})
                self.models["pii"] = PIIDetector(
                    classifier_path=pii_config.get("classifier_path", os.path.join(os.path.dirname(__file__), "pii_blur/pii_clf.joblib")),
                    conf_thresh=pii_config.get("conf_thresh", 0.35),
                    min_area=pii_config.get("min_area", 80),
                    K_confirm=pii_config.get("K_confirm", 2),
                    K_hold=pii_config.get("K_hold", 8)
                )
                self.model_locks["pii"] = Lock()
                print("[UnifiedDetector] PII detector initialized")
            except Exception as e:
                print(f"[UnifiedDetector][WARN] PII detector initialization failed: {e}")
        
        # Plate detector - NOW CPU-COMPATIBLE with ONNX Runtime
        if self.config.get("enable_plate", True) and PlateDetector is not None:
            try:
                plate_config = self.config.get("plate", {})
                # Use ONNX model instead of TensorRT engine
                model_path = plate_config.get(
                    "model_path",
                    os.path.join(os.path.dirname(__file__), "plate_blur/yolov10n_plate_320.onnx")
                )
                self.models["plate"] = PlateDetector(
                    model_path=model_path,
                    imgsz=plate_config.get("imgsz", 960),
                    conf_thresh=plate_config.get("conf_thresh", 0.35),
                    iou_thresh=plate_config.get("iou_thresh", 0.5)
                )
                self.model_locks["plate"] = Lock()
                print("[UnifiedDetector] Plate detector initialized (CPU-compatible)")
            except Exception as e:
                print(f"[UnifiedDetector][WARN] Plate detector initialization failed: {e}")
        
        print(f"[UnifiedDetector] Initialized with {len(self.models)} models: {list(self.models.keys())}")
        
        # Check for running loop before warmup to avoid RuntimeError: asyncio.run() cannot be called from a running event loop
        try:
            asyncio.get_running_loop()
            print("[UnifiedDetector] Event loop detected. Skipping synchronous warmup to avoid crash.")
            return
        except RuntimeError:
            pass # No loop, safe to run warmup

        dummy_frame = np.zeros((640, 640, 3), dtype=np.uint8)
        for _ in range(10):
            self.process_frame(dummy_frame, frame_id=-1)
        print("[UnifiedDetector] Engine warmed up with dummy frame")
        
        # STAGE 2: Real-content warm-up (NEW - this is what you need)
        self._advanced_warmup()

    def _get_tracker(self, room_id: str, model_type: str) -> Optional[MotionTracker]:
        """Get or create motion tracker for specific room and detection type."""
        if not self.enable_motion_tracking or not room_id:
            return None

        # Initialize room trackers dict if needed
        if room_id not in self.room_trackers:
            self.room_trackers[room_id] = {}

        # Create tracker for this model type if needed
        if model_type not in self.room_trackers[room_id]:
            # Customize tracker parameters based on detection type
            if model_type == "face":
                # Faces: moderate expansion for natural head movement
                self.room_trackers[room_id][model_type] = MotionTracker(
                    max_corners=30,
                    quality_level=0.01,
                    min_distance=7,
                    velocity_expansion_factor=1.8,  # Increased from 1.5 for better fast-motion coverage
                    max_velocity_expansion=60       # Increased from 50
                )
            elif model_type == "plate":
                # License plates: aggressive expansion for fast vehicles
                self.room_trackers[room_id][model_type] = MotionTracker(
                    max_corners=25,
                    quality_level=0.015,
                    min_distance=5,
                    velocity_expansion_factor=2.0,  # More aggressive for vehicles
                    max_velocity_expansion=80
                )
            elif model_type == "pii":
                # Text/PII: moderate expansion for documents/screens
                self.room_trackers[room_id][model_type] = MotionTracker(
                    max_corners=20,
                    quality_level=0.02,
                    min_distance=8,
                    velocity_expansion_factor=1.3,
                    max_velocity_expansion=40
                )

            print(f"[UnifiedDetector] Created {model_type} motion tracker for room {room_id}")

        return self.room_trackers[room_id][model_type]

    def _advanced_warmup(self):
        """Advanced warm-up with realistic content and varied sizes."""
        print("[UnifiedDetector] Starting advanced warm-up with realistic content...")

        # Create varied frames with actual content
        warmup_frames = []

        # Different sizes (common webcam/phone resolutions)
        sizes = [(480, 640), (720, 1280), (1080, 1920), (480, 480)]

        for i, (h, w) in enumerate(sizes):
            # Create frame with realistic content
            frame = np.random.randint(0, 255, (h, w, 3), dtype=np.uint8)

            # Add some geometric shapes (simulates faces/objects)
            cv2.rectangle(frame, (w//4, h//4), (w//2, h//2), (255, 255, 255), -1)
            cv2.circle(frame, (3*w//4, h//4), 50, (128, 128, 128), -1)

            # Add some text-like patterns (simulates PII)
            cv2.putText(frame, "ABC123", (w//2, 3*h//4), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0),3)
            warmup_frames.append(frame)

        # Process varied frames multiple times
        for round_num in range(3):  # 3 rounds
            for i, frame in enumerate(warmup_frames):
                start_time = time.time()
                results = self.process_frame(frame, frame_id=f"warmup_{round_num}_{i}")
                warmup_time = time.time() - start_time
                print(f"[UnifiedDetector] Warmup round {round_num+1}/3, frame {i+1}/4: {warmup_time:.3f}s")
        print("[UnifiedDetector] Advanced warm-up complete - models should be fully optimized")
    
    async def process_frame_async(self, frame: np.ndarray, frame_id: int, stride: int = 1, tta_every: int = 0, room_id: str = None, active_models: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Process a frame with all enabled models, using adaptive stride and motion tracking.
        """
        results = {
            "frame_id": frame_id,
            "timestamp": time.time(),
            "models": {}
        }
        
        # Determine if we should run heavy inference this frame
        # We use a simple modulo check on frame_id (assuming it's an incrementing integer)
        # If frame_id is a string (e.g. "warmup_..."), we force inference
        should_run_inference = True
        try:
            f_id = int(frame_id)
            if f_id % stride != 0:
                should_run_inference = False
        except ValueError:
            pass # Force inference for non-integer IDs

        tasks = []

        # 1. Face Detection (Lightweight - Run every frame or every 2nd)
        # YuNet is fast enough to run often, but we can stride it too if needed
        if "face" in self.models and (active_models is None or "face" in active_models):
            if should_run_inference:
                tasks.append(self._process_face_model_async("face", frame, frame_id, stride, tta_every, room_id=room_id))
            elif room_id:
                # Use tracker prediction
                tracker = self._get_tracker(room_id, "face")
                if tracker:
                    # Predict new positions
                    predicted_rects = tracker.predict(frame)
                    # Return in same format as detection
                    results["models"]["face"] = {"rectangles": predicted_rects, "count": len(predicted_rects), "source": "tracker"}

        # 2. PII/Text Detection (Heavy - Run on stride)
        if "pii" in self.models and (active_models is None or "pii" in active_models):
            if should_run_inference:
                tasks.append(self._process_pii_model_async("pii", frame, frame_id, stride, tta_every, room_id=room_id))
            elif room_id:
                tracker = self._get_tracker(room_id, "pii")
                if tracker:
                    predicted_rects = tracker.predict(frame)
                    results["models"]["pii"] = {"rectangles": predicted_rects, "count": len(predicted_rects), "source": "tracker"}

        # 3. Plate Detection (Medium - Run on stride)
        if "plate" in self.models and (active_models is None or "plate" in active_models):
            if should_run_inference:
                tasks.append(self._process_plate_model_async("plate", frame, frame_id, stride, tta_every, room_id=room_id))
            elif room_id:
                tracker = self._get_tracker(room_id, "plate")
                if tracker:
                    predicted_rects = tracker.predict(frame)
                    results["models"]["plate"] = {"rectangles": predicted_rects, "count": len(predicted_rects), "source": "tracker"}

        if tasks:
            model_results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in model_results:
                if isinstance(result, Exception):
                    print(f"[UnifiedDetector][ERROR] Model processing failed: {result}")
                    continue
                if result:
                    model_type, model_data = result
                    results["models"][model_type] = model_data
                    
                    # Update tracker with new detections
                    if room_id and self.enable_motion_tracking:
                        tracker = self._get_tracker(room_id, model_type)
                        if tracker and "rectangles" in model_data:
                            tracker.update(frame, model_data["rectangles"])

        # print(f"[UnifiedDetector] Frame {frame_id} processed. Inference: {should_run_inference}")
        return results
    
    # ... helper methods ...

    def process_frame(self, frame: np.ndarray, frame_id: int, stride: int = 1, tta_every: int = 0, room_id: str = None, active_models: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Synchronous wrapper to process a frame with all enabled models.
        
        Args:
            frame: Input frame (BGR format)
            frame_id: Frame identifier
            active_models: Optional list of models to run
            
        Returns:
            Dictionary containing results from all models
        """
        print("[UnifiedDetector] Processing frame", frame_id)
        return asyncio.run(self.process_frame_async(frame, frame_id, stride, tta_every, room_id, active_models))
    
    def get_all_rectangles(self, results: Dict[str, Any]) -> List[List[int]]:
        """
        Extract all rectangles from detection results.
        
        Args:
            results: Results from process_frame
            
        Returns:
            Combined list of all rectangles [x1, y1, x2, y2]
        """
        rectangles = []
        
        # Face rectangles
        face_data = results.get("models", {}).get("face", {})
        if "rectangles" in face_data:
            rectangles.extend(face_data["rectangles"])
        
        # PII rectangles
        pii_data = results.get("models", {}).get("pii", {})
        if "rectangles" in pii_data:
            rectangles.extend(pii_data["rectangles"])
        
        # Plate rectangles
        plate_data = results.get("models", {}).get("plate", {})
        if "rectangles" in plate_data:
            rectangles.extend(plate_data["rectangles"])
        
        return rectangles
    
    def get_all_polygons(self, results: Dict[str, Any]) -> List[np.ndarray]:
        """
        Extract all polygons from detection results.
        Note: PII detector now returns rectangles, not polygons.
        
        Args:
            results: Results from process_frame
            
        Returns:
            Combined list of all polygons (empty list since PII now uses rectangles)
        """
        polygons = []
        
        # PII now returns rectangles, not polygons
        # If polygons are needed, convert rectangles to polygons:
        # pii_data = results.get("models", {}).get("pii", {})
        # if "rectangles" in pii_data:
        #     for rect in pii_data["rectangles"]:
        #         x1, y1, x2, y2 = rect
        #         poly = np.array([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], dtype=np.int32)
        #         polygons.append(poly)
        
        return polygons
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about all loaded models."""
        info = {
            "unified_detector": {
                "enabled_models": list(self.models.keys()),
                "model_count": len(self.models)
            }
        }
        
        for name, model in self.models.items():
            if hasattr(model, "get_model_info"):
                info[name] = model.get_model_info()
        
        return info
    
    def update_face_embedding(self, embedding: np.ndarray) -> bool:
        """
        Update the face detector's dynamic embedding for whitelisting.
        
        Args:
            embedding: Face embedding to use for whitelisting
            
        Returns:
            True if successful, False otherwise
        """
        if "face" in self.models:
            try:
                return self.models["face"].set_dynamic_embedding(embedding)
            except Exception as e:
                print(f"[UnifiedDetector][ERROR] Failed to update face embedding: {e}")
                return False
        else:
            print("[UnifiedDetector][WARN] Face detector not available for embedding update")
            return False

    def extract_face_embedding(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract face embedding from frame using the face detector.
        
        Args:
            frame: Input frame
            
        Returns:
            Embedding or None
        """
        if "face" in self.models and hasattr(self.models["face"], "extract_embedding"):
            return self.models["face"].extract_embedding(frame)
        return None
    
    def cleanup_room(self, room_id: str) -> bool:
        """
        Clean up room-specific data from all models.

        Args:
            room_id: Room ID to clean up

        Returns:
            True if successful, False otherwise
        """
        try:
            if "face" in self.models:
                self.models["face"].cleanup_room(room_id)

            if "pii" in self.models:
                self.models["pii"].cleanup_room(room_id)

            print(f"[UnifiedDetector] Cleaned up data for room: {room_id}")
            return True
        except Exception as e:
            print(f"[UnifiedDetector][ERROR] Failed to cleanup room {room_id}: {e}")
            return False

    def shutdown(self) -> None:
        """
        Shutdown the detector and clean up resources.

        This method should be called when the detector is no longer needed
        to properly release ThreadPoolExecutor and other resources.
        """
        try:
            print("[UnifiedDetector] Shutting down...")

            # Shutdown thread pool executor
            if hasattr(self, 'executor') and self.executor is not None:
                self.executor.shutdown(wait=True)
                print("[UnifiedDetector] ThreadPoolExecutor shutdown complete")

            # Clean up model-specific resources
            if "face" in self.models and hasattr(self.models["face"], "__del__"):
                self.models["face"].__del__()

            print("[UnifiedDetector] Shutdown complete")
        except Exception as e:
            print(f"[UnifiedDetector][ERROR] Error during shutdown: {e}")

    def process_frame_with_mouth_landmarks(self, frame: np.ndarray, frame_id: int,
                                         stride: int = 1, room_id: str = None) -> Tuple[int, List[List[int]], List[Dict]]:
        """
        Enhanced frame processing that returns both face blur regions and mouth landmarks.
        Routes to the face detector's mouth landmark extraction method.

        Args:
            frame: Input frame (BGR format)
            frame_id: Frame identifier
            stride: Process every N frames for detection

        Returns:
            Tuple of (frame_id, face_blur_regions, mouth_regions)
        """
        if "face" in self.models:
            try:
                return self.models["face"].process_frame_with_mouth_landmarks(frame, frame_id, stride, room_id=room_id)
            except Exception as e:
                print(f"[UnifiedDetector][ERROR] Mouth landmark processing failed: {e}")
                # Fallback: return regular face processing with empty mouths
                frame_id_result, rectangles, ellipses = self.models["face"].process_frame(frame, frame_id, stride, room_id=room_id)
                return frame_id_result, rectangles, []  # frame_id, rectangles, empty mouths
        else:
            print("[UnifiedDetector][WARN] Face detector not available for mouth landmarks")
            return frame_id, [], []

    def detect_and_blur(
        self,
        frame: np.ndarray,
        blur_strength: Optional[int] = None,
        whitelist_embedding: Optional[np.ndarray] = None,
        active_models: Optional[List[str]] = None,
    ) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Detect PII in frame and apply blur to detected regions.

        Args:
            frame: Input frame (BGR format)
            blur_strength: Optional custom blur strength (0-255)
            whitelist_embedding: Optional face embedding for whitelist comparison
            active_models: Optional list of models to run

        Returns:
            Tuple of (blurred_frame, rectangles_list)
            rectangles_list format: [{"type": "face/pii/plate", "region": [x1,y1,x2,y2]}, ...]
        """
        # Step 1: Detect all PII regions
        results = self.process_frame(frame, frame_id=-1, active_models=active_models)

        # Step 2: Extract all rectangles from results
        all_rectangles = []

        # Face rectangles
        face_data = results.get("models", {}).get("face", {})
        for rect in face_data.get("rectangles", []):
            x1, y1, x2, y2 = rect
            all_rectangles.append({
                "type": "face",
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2)
            })

        # PII rectangles
        pii_data = results.get("models", {}).get("pii", {})
        for rect in pii_data.get("rectangles", []):
            x1, y1, x2, y2 = rect
            all_rectangles.append({
                "type": "pii",
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2)
            })

        # Plate rectangles
        plate_data = results.get("models", {}).get("plate", {})
        for rect in plate_data.get("rectangles", []):
            x1, y1, x2, y2 = rect
            all_rectangles.append({
                "type": "plate",
                "x1": int(x1),
                "y1": int(y1),
                "x2": int(x2),
                "y2": int(y2)
            })

        # Step 3: Apply blur to all detected regions
        blurred_frame = frame.copy()

        for rect_info in all_rectangles:
            x1 = rect_info["x1"]
            y1 = rect_info["y1"]
            x2 = rect_info["x2"]
            y2 = rect_info["y2"]
            
            w = x2 - x1
            h = y2 - y1
            
            # Skip invalid regions
            if w <= 0 or h <= 0:
                continue

            # Determine blur kernel size
            if blur_strength is not None:
                ksize = blur_strength
            else:
                ksize = 75  # Default blur strength

            # Ensure kernel size is odd and positive
            ksize = max(1, ksize)
            if ksize % 2 == 0:
                ksize += 1

            # Extract region
            roi = blurred_frame[y1:y2, x1:x2]
            
            if rect_info["type"] == "face":
                # Premium Feathered Ellipse Blur for Faces
                # Create mask
                mask = np.zeros((h, w), dtype=np.uint8)
                center = (w // 2, h // 2)
                axes = (int(w * 0.45), int(h * 0.55)) # Slightly smaller than box to fit
                cv2.ellipse(mask, center, axes, 0, 0, 360, 255, -1)
                
                # Subtle feathering
                mask_blurred = cv2.GaussianBlur(mask, (21, 21), 10)
                mask_normalized = mask_blurred / 255.0
                mask_3ch = np.dstack([mask_normalized] * 3)
                
                # Blur the ROI
                roi_blurred = cv2.GaussianBlur(roi, (ksize, ksize), 0)
                
                # Blend
                roi_final = (roi_blurred * mask_3ch + roi * (1 - mask_3ch)).astype(np.uint8)
                blurred_frame[y1:y2, x1:x2] = roi_final
                
            else:
                # Standard Rectangular Blur for PII/Plates (cleaner for text)
                roi_blurred = cv2.GaussianBlur(roi, (ksize, ksize), 0)
                blurred_frame[y1:y2, x1:x2] = roi_blurred

        print(f"[UnifiedDetector] detect_and_blur: Applied blur to {len(all_rectangles)} regions")
        return blurred_frame, all_rectangles

    def apply_blur_only(
        self,
        frame: np.ndarray,
        rectangles: List[Dict[str, Any]],
        blur_strength: Optional[int] = None,
    ) -> np.ndarray:
        """
        Apply blur to pre-detected regions without running detection.

        Args:
            frame: Input frame (BGR format)
            rectangles: List of rectangles to blur [{"region": [x1,y1,x2,y2]}, ...]
            blur_strength: Optional custom blur strength

        Returns:
            Blurred frame
        """
        blurred_frame = frame.copy()

        for rect_info in rectangles:
            rect = rect_info.get("region", rect_info)  # Support both dict and list formats
            if isinstance(rect, dict):
                rect = rect.get("region", [])

            if len(rect) < 4:
                continue

            x1, y1, x2, y2 = rect[:4]

            # Determine blur kernel size
            if blur_strength is not None:
                ksize = blur_strength
            else:
                ksize = 75  # Default

            # Ensure kernel size is odd and positive
            ksize = max(1, ksize)
            if ksize % 2 == 0:
                ksize += 1

            # Apply blur
            region = blurred_frame[y1:y2, x1:x2]
            if region.size > 0:
                blurred_region = cv2.GaussianBlur(region, (ksize, ksize), 0)
                blurred_frame[y1:y2, x1:x2] = blurred_region

        print(f"[UnifiedDetector] apply_blur_only: Applied blur to {len(rectangles)} regions")
        return blurred_frame


def demo_unified_detector():
    """Demonstration of the unified detector."""
    # Configuration for all models
    config = {
        "enable_face": True,
        "enable_pii": True,
        "enable_plate": True,
        "face": {
            "embed_path": "video_models/face_blur/whitelist/creator_embedding.json",
            "threshold": 0.35,
            "dilate_px": 12
        },
        "pii": {
            "classifier_path": "video_models/pii_blur/pii_clf.joblib",
            "conf_thresh": 0.35
        },
        "plate": {
            "weights_path": "video_models/plate_blur/best.pt",
            "conf_thresh": 0.25
        }
    }
    
    # Initialize detector
    detector = UnifiedBlurDetector(config)
    
    # Print model information
    model_info = detector.get_model_info()
    print("=== Model Information ===")
    for key, value in model_info.items():
        print(f"{key}: {value}")
    
    # Demo with webcam
    print("\n=== Starting webcam demo ===")
    print("Press 'q' to quit, 's' to save current frame results")
    
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Cannot open webcam")
        return
    
    frame_id = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process frame
            results = detector.process_frame(frame, frame_id)
            
            # Visualize results
            vis_frame = frame.copy()
            
            # Draw face rectangles (red)
            face_data = results.get("models", {}).get("face", {})
            if "rectangles" in face_data:
                for rect in face_data["rectangles"]:
                    x1, y1, x2, y2 = rect
                    cv2.rectangle(vis_frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    cv2.putText(vis_frame, "FACE", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            
            # Draw PII rectangles (green)
            pii_data = results.get("models", {}).get("pii", {})
            if "rectangles" in pii_data:
                for rect in pii_data["rectangles"]:
                    x1, y1, x2, y2 = rect
                    cv2.rectangle(vis_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(vis_frame, "PII", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Draw plate rectangles (blue)
            plate_data = results.get("models", {}).get("plate", {})
            if "rectangles" in plate_data:
                for rect in plate_data["rectangles"]:
                    x1, y1, x2, y2 = rect
                    cv2.rectangle(vis_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                    cv2.putText(vis_frame, "PLATE", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
            
            # Add info text
            total_detections = sum([
                face_data.get("count", 0),
                pii_data.get("count", 0),
                plate_data.get("count", 0)
            ])
            
            info_text = f"Frame: {frame_id}, Detections: {total_detections}"
            cv2.putText(vis_frame, info_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            cv2.imshow("Unified Blur Detector Demo", vis_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                # Save current results
                filename = f"detection_results_frame_{frame_id}.txt"
                with open(filename, 'w') as f:
                    f.write(f"Frame {frame_id} Detection Results:\n")
                    f.write(f"Face rectangles: {face_data.get('rectangles', [])}\n")
                    f.write(f"PII rectangles: {pii_data.get('rectangles', [])}\n")
                    f.write(f"Plate rectangles: {plate_data.get('rectangles', [])}\n")
                print(f"Saved results to {filename}")
            
            frame_id += 1
            
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    demo_unified_detector()
