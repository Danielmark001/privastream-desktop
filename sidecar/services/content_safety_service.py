import logging
from typing import List, Dict, Any, Optional
import numpy as np
import cv2
from ultralytics import YOLO
from paddleocr import PaddleOCR

logger = logging.getLogger(__name__)

class ContentSafetyService:
    """
    Service for detecting unsafe content:
    1. Unsafe Objects (Weapons, Alcohol) via YOLOv8
    2. Banned Brands/Logos via PaddleOCR (Text-based)
    3. NSFW (Placeholder for NudeNet)
    """

    def __init__(self, model_path: str = "yolov8n.pt", use_gpu: bool = True):
        self.use_gpu = use_gpu
        
        # Initialize YOLOv8 for object detection
        try:
            self.yolo = YOLO(model_path)
            logger.info(f"YOLOv8 initialized from {model_path}")
        except Exception as e:
            logger.error(f"Failed to initialize YOLOv8: {e}")
            self.yolo = None

        # Initialize PaddleOCR for Brand Safety (Text-based Logo Detection)
        # We reuse the same OCR engine if possible, but for isolation we init a lightweight one here
        try:
            self.ocr = PaddleOCR(use_angle_cls=False, lang='en', use_gpu=use_gpu, show_log=False)
            logger.info("PaddleOCR initialized for Brand Safety")
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {e}")
            self.ocr = None

        # Configuration
        self.unsafe_classes = [
            'knife', 'gun', 'weapon', 'alcohol', 'wine glass', 'bottle'
        ]
        
        self.banned_brands = [
            "competitor_x", "bad_brand", "hate_group_name"
        ]

    def analyze_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Analyze a frame for all types of unsafe content.
        """
        results = {
            "is_safe": True,
            "detections": []
        }

        # 1. Object Detection (YOLO)
        if self.yolo:
            yolo_results = self.yolo(frame, verbose=False)
            for r in yolo_results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    cls_name = self.yolo.names[cls_id]
                    conf = float(box.conf[0])

                    if cls_name in self.unsafe_classes and conf > 0.5:
                        results["is_safe"] = False
                        results["detections"].append({
                            "type": "unsafe_object",
                            "label": cls_name,
                            "confidence": conf,
                            "box": box.xyxy[0].tolist()
                        })

        # 2. Brand Safety (OCR)
        if self.ocr:
            ocr_results = self.ocr.ocr(frame, cls=False)
            if ocr_results and ocr_results[0]:
                for line in ocr_results[0]:
                    text = line[1][0].lower()
                    conf = line[1][1]

                    for brand in self.banned_brands:
                        if brand in text and conf > 0.6:
                            results["is_safe"] = False
                            results["detections"].append({
                                "type": "banned_brand",
                                "label": brand,
                                "confidence": conf,
                                "box": line[0] # Polygon coordinates
                            })

        return results

    def update_banned_brands(self, brands: List[str]):
        """Update the list of banned brands."""
        self.banned_brands = [b.lower() for b in brands]
