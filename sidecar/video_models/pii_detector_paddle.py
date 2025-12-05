import cv2
import numpy as np
import re
from typing import List, Tuple, Optional, Dict, Any
from paddleocr import PaddleOCR
import logging

# Configure logging
logger = logging.getLogger(__name__)

class PIIDetector:
    """
    PII Detector using PaddleOCR to find sensitive text.
    """

    def __init__(
        self,
        classifier_path: str = None, # Not used for OCR-based PII, kept for compatibility
        conf_thresh: float = 0.5,
        min_area: int = 0,
        K_confirm: int = 0,
        K_hold: int = 0,
        use_gpu: bool = True
    ):
        """
        Initialize PaddleOCR for PII detection.
        
        Args:
            conf_thresh: Confidence threshold for text detection
            use_gpu: Whether to use GPU for inference
        """
        self.conf_thresh = conf_thresh
        
        # Initialize PaddleOCR
        # use_angle_cls=True enables orientation classification (slower but handles rotated text)
        # lang='en' for English support (can be expanded)
        try:
            self.ocr = PaddleOCR(
                use_angle_cls=True, 
                lang='en', 
                use_gpu=use_gpu,
                show_log=False
            )
            logger.info(f"PaddleOCR initialized (GPU={use_gpu})")
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {e}")
            raise

        # Regex patterns for PII
        self.pii_patterns = {
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "phone": r'\b(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b',
            "credit_card": r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
            "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
            "ipv4": r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
        }

    def process_frame(
        self, 
        frame: np.ndarray, 
        frame_id: int, 
        room_id: str = None
    ) -> Tuple[int, List[List[int]]]:
        """
        Detect PII in a frame.

        Args:
            frame: Input image (BGR)
            frame_id: Frame identifier
            room_id: Room identifier (unused for now)

        Returns:
            Tuple of (frame_id, list of bounding boxes [x1, y1, x2, y2])
        """
        rectangles = []
        
        try:
            # Run OCR
            # result structure: [[[[x1,y1],[x2,y2],[x3,y3],[x4,y4]], (text, confidence)], ...]
            result = self.ocr.ocr(frame, cls=True)
            
            if not result or result[0] is None:
                return frame_id, []

            for line in result[0]:
                coords = line[0]
                text_info = line[1]
                text = text_info[0]
                confidence = text_info[1]

                if confidence < self.conf_thresh:
                    continue

                # Check if text contains PII
                if self._contains_pii(text):
                    # Convert polygon to bounding box [x1, y1, x2, y2]
                    x_coords = [int(p[0]) for p in coords]
                    y_coords = [int(p[1]) for p in coords]
                    
                    x1, x2 = min(x_coords), max(x_coords)
                    y1, y2 = min(y_coords), max(y_coords)
                    
                    # Add padding
                    padding = 5
                    h, w = frame.shape[:2]
                    x1 = max(0, x1 - padding)
                    y1 = max(0, y1 - padding)
                    x2 = min(w, x2 + padding)
                    y2 = min(h, y2 + padding)

                    rectangles.append([x1, y1, x2, y2])

        except Exception as e:
            logger.error(f"Error processing frame {frame_id}: {e}")

        return frame_id, rectangles

    def _contains_pii(self, text: str) -> bool:
        """Check if text matches any PII patterns."""
        for label, pattern in self.pii_patterns.items():
            if re.search(pattern, text):
                return True
        return False

    def cleanup_room(self, room_id: str):
        """Cleanup resources for a room (stateless for now)."""
        pass

    def get_model_info(self) -> Dict[str, Any]:
        """Get model info."""
        return {
            "type": "PaddleOCR",
            "patterns": list(self.pii_patterns.keys())
        }
