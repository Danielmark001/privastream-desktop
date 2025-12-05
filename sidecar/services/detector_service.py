"""
Detector service - manages detector lifecycle and configuration.
Replaces global detector variable with proper encapsulation.
"""
from typing import Optional, Dict, Any, Tuple, List
import numpy as np
from pathlib import Path
import sys

from core.logging import get_logger
from core.errors import DetectorError, ErrorCode
from config.settings import Settings

logger = get_logger(__name__)


class DetectorService:
    """
    Service for managing video detection models.

    Provides a clean interface to the UnifiedBlurDetector,
    handling initialization, configuration, and processing.
    """

    def __init__(self, settings: Settings):
        """
        Initialize detector service.

        Args:
            settings: Application settings
        """
        self.settings = settings
        self._detector = None
        self._initialized = False

    def initialize(self, enable_recognition: bool = True) -> None:
        """
        Initialize the detector with current settings.

        Args:
            enable_recognition: Whether to enable face recognition (SFace).
                                If False, only detection (YuNet) is used.
        
        Raises:
            DetectorError: If initialization fails
        """
        try:
            # Add video_models to path
            models_path = str(self.settings.models_dir)
            if models_path not in sys.path:
                sys.path.append(models_path)

            from video_models.unified_detector import UnifiedBlurDetector

            logger.info("Initializing UnifiedBlurDetector...")

            # Build detector config from settings
            # If recognition is disabled, we pass None for embed_path to YuNet
            embed_path = self.settings.detector.face.embed_path if enable_recognition else None
            
            # Force face detection ON for live demo (critical for privacy)
            detector_config = {
                "enable_face": True,  # Always enable face detection
                "enable_pii": self.settings.detector.enable_pii,
                "enable_plate": self.settings.detector.enable_plate,
                "face": {
                    "embed_path": embed_path,
                    # ... other face config ...
                },
                "enable_pii": self.settings.detector.enable_pii,
                "enable_plate": self.settings.detector.enable_plate,
                "pii": {
                    "classifier_path": self.settings.detector.pii.classifier_path,
                    "conf_thresh": self.settings.detector.pii.conf_thresh,
                },
                "blur_strength": {
                    "face": self.settings.detector.blur_strength.face,
                    "pii": self.settings.detector.blur_strength.pii,
                    "plate": self.settings.detector.blur_strength.plate,
                    "default": self.settings.detector.blur_strength.default,
                }
            }
            
            logger.info(f"Detector config: face_enabled=True, pii_enabled={self.settings.detector.enable_pii}, recognition_enabled={enable_recognition}")

            self._detector = UnifiedBlurDetector(config=detector_config)
            self._initialized = True

            logger.info(
                "Detector initialized successfully",
                extra={
                    "face_enabled": self.settings.detector.enable_face,
                    "pii_enabled": self.settings.detector.enable_pii,
                    "plate_enabled": self.settings.detector.enable_plate,
                }
            )

        except Exception as e:
            logger.error(f"Failed to initialize detector: {e}", exc_info=True)
            raise DetectorError(
                message=f"Detector initialization failed: {str(e)}",
                code=ErrorCode.DETECTOR_INIT_FAILED,
                details={"error": str(e)}
            )

    def is_initialized(self) -> bool:
        """Check if detector is initialized."""
        return self._initialized and self._detector is not None

    def ensure_initialized(self) -> None:
        """Ensure detector is initialized, raise error if not."""
        if not self.is_initialized():
            raise DetectorError(
                message="Detector not initialized. Call initialize() first.",
                code=ErrorCode.DETECTOR_NOT_INITIALIZED
            )

    def detect_and_blur(
        self,
        frame: np.ndarray,
        blur_strength: Optional[int] = None,
        whitelist_embedding: Optional[np.ndarray] = None,
        active_models: Optional[List[str]] = None,
    ) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Detect and blur PII in frame.

        Args:
            frame: Input frame (BGR format)
            blur_strength: Optional custom blur strength
            whitelist_embedding: Optional face embedding for whitelist comparison
            active_models: Optional list of models to run

        Returns:
            Tuple of (blurred_frame, detection_rectangles)

        Raises:
            DetectorError: If detection fails
        """
        self.ensure_initialized()

        try:
            blurred_frame, rectangles = self._detector.detect_and_blur(
                frame,
                blur_strength=blur_strength,
                whitelist_embedding=whitelist_embedding,
                active_models=active_models,
            )
            return blurred_frame, rectangles

        except Exception as e:
            logger.error(f"Detection failed: {e}", exc_info=True)
            raise DetectorError(
                message=f"Detection processing failed: {str(e)}",
                code=ErrorCode.DETECTOR_PROCESSING_FAILED,
                details={"error": str(e)}
            )

    def apply_blur_only(
        self,
        frame: np.ndarray,
        rectangles: List[Dict[str, Any]],
        blur_strength: Optional[int] = None,
    ) -> np.ndarray:
        """
        Apply blur to specified regions without detection.

        Args:
            frame: Input frame
            rectangles: List of regions to blur
            blur_strength: Optional custom blur strength

        Returns:
            Blurred frame

        Raises:
            DetectorError: If blurring fails
        """
        self.ensure_initialized()

        try:
            blurred_frame = self._detector.apply_blur_only(
                frame,
                rectangles,
                blur_strength=blur_strength,
            )
            return blurred_frame

        except Exception as e:
            logger.error(f"Blur application failed: {e}", exc_info=True)
            raise DetectorError(
                message=f"Blur application failed: {str(e)}",
                code=ErrorCode.DETECTOR_PROCESSING_FAILED,
                details={"error": str(e)}
            )

    def extract_face_embedding(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract face embedding from frame.
        
        Args:
            frame: Input frame
            
        Returns:
            Embedding or None
        """
        self.ensure_initialized()
        return self._detector.extract_face_embedding(frame)

    def get_info(self) -> Dict[str, Any]:
        """
        Get detector configuration and status.

        Returns:
            Dictionary with detector information
        """
        if not self.is_initialized():
            return {
                "initialized": False,
                "enabled_detectors": {},
                "blur_strengths": {},
            }

        return {
            "initialized": True,
            "enabled_detectors": {
                "face": self.settings.detector.enable_face,
                "pii": self.settings.detector.enable_pii,
                "plate": self.settings.detector.enable_plate,
            },
            "blur_strengths": {
                "face": self.settings.detector.blur_strength.face,
                "pii": self.settings.detector.blur_strength.pii,
                "plate": self.settings.detector.blur_strength.plate,
                "default": self.settings.detector.blur_strength.default,
            },
            "performance_config": {
                "detection_fps": self.settings.performance.detection_fps_base,
                "adaptive_stride_enabled": self.settings.performance.enable_adaptive_stride,
                "frame_caching_enabled": self.settings.performance.enable_frame_caching,
            }
        }
