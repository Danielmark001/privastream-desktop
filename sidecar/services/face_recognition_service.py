"""
Face Recognition Service - manages whitelist-based face blurring.

Uses YuNet for detection and SFace for recognition to identify and skip
whitelisted faces while blurring all others.
"""
from typing import Optional, Dict, Any, List, Tuple
import numpy as np
from pathlib import Path
import json
import cv2
from datetime import datetime

from core.logging import get_logger
from core.errors import DetectorError, ErrorCode

logger = get_logger(__name__)


class FaceRecognitionService:
    """
    Face recognition service for whitelist-based blurring.
    
    Workflow:
    1. Detect all faces using YuNet
    2. For each face, extract embedding using SFace
    3. Compare with whitelist embeddings
    4. Return only non-whitelisted faces for blurring
    """
    
    def __init__(self, whitelist_dir: str = "whitelist"):
        """
        Initialize face recognition service.
        
        Args:
            whitelist_dir: Directory to store face embeddings
        """
        self.whitelist_dir = Path(whitelist_dir)
        self.whitelist_dir.mkdir(parents=True, exist_ok=True)
        
        self.detector = None
        self.recognizer = None
        self.whitelist_embeddings: Dict[str, np.ndarray] = {}
        self.similarity_threshold = 0.363  # Standard SFace threshold
        self.input_size = (640, 480)
        
        logger.info(f"[FaceRecognitionService] Initialized with whitelist dir: {self.whitelist_dir}")
    
    def initialize(self) -> None:
        """
        Initialize YuNet detector and SFace recognizer.
        
        Raises:
            DetectorError: If initialization fails
        """
        try:
            # Download models if needed
            model_dir = Path("models/weights/face")
            model_dir.mkdir(parents=True, exist_ok=True)
            
            yunet_path = self._download_model(
                model_dir,
                "face_detection_yunet_2023mar.onnx",
                "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
            )
            
            sface_path = self._download_model(
                model_dir,
                "face_recognition_sface_2021dec.onnx",
                "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
            )
            
            # Initialize YuNet detector
            self.detector = cv2.FaceDetectorYN.create(
                model=str(yunet_path),
                config="",
                input_size=self.input_size,
                score_threshold=0.6,
                nms_threshold=0.3,
                top_k=5000,
                backend_id=cv2.dnn.DNN_BACKEND_DEFAULT,
                target_id=cv2.dnn.DNN_TARGET_CPU
            )
            
            # Initialize SFace recognizer
            self.recognizer = cv2.FaceRecognizerSF.create(
                model=str(sface_path),
                config="",
                backend_id=cv2.dnn.DNN_BACKEND_DEFAULT,
                target_id=cv2.dnn.DNN_TARGET_CPU
            )
            
            # Load existing whitelist
            self._load_whitelist()
            
            logger.info("[FaceRecognitionService] Initialized successfully")
            logger.info(f"  Detector: YuNet")
            logger.info(f"  Recognizer: SFace")
            logger.info(f"  Whitelist: {len(self.whitelist_embeddings)} faces")
            
        except Exception as e:
            logger.error(f"[FaceRecognitionService] Init failed: {e}", exc_info=True)
            raise DetectorError(
                message=f"Failed to initialize face recognition: {e}",
                code=ErrorCode.DETECTOR_INIT_FAILED
            )
    
    def _download_model(self, model_dir: Path, filename: str, url: str) -> Path:
        """Download model if not exists."""
        model_path = model_dir / filename
        
        if model_path.exists():
            logger.info(f"[FaceRecognitionService] Model found: {filename}")
            return model_path
        
        import urllib.request
        logger.info(f"[FaceRecognitionService] Downloading {filename}...")
        try:
            urllib.request.urlretrieve(url, model_path)
            logger.info(f"[FaceRecognitionService] Downloaded {filename}")
            return model_path
        except Exception as e:
            logger.error(f"[FaceRecognitionService] Download failed: {e}")
            raise
    
    def _load_whitelist(self) -> None:
        """Load all whitelist embeddings from disk."""
        self.whitelist_embeddings.clear()
        
        for file_path in self.whitelist_dir.glob("*_embedding.json"):
            try:
                data = json.loads(file_path.read_text(encoding="utf-8"))
                name = data.get("name", file_path.stem.replace("_embedding", ""))
                embedding = np.array(data["embedding"], dtype=np.float32)
                
                self.whitelist_embeddings[name] = embedding
                logger.info(f"[FaceRecognitionService] Loaded whitelist: {name}")
            except Exception as e:
                logger.error(f"[FaceRecognitionService] Failed to load {file_path}: {e}")
    
    def add_to_whitelist(self, name: str, embedding: np.ndarray) -> bool:
        """
        Add face embedding to whitelist.
        
        Args:
            name: Identifier for the face
            embedding: 128-dimensional SFace embedding
            
        Returns:
            True if successful
        """
        try:
            # Save to disk
            file_path = self.whitelist_dir / f"{name}_embedding.json"
            data = {
                "name": name,
                "embedding": embedding.tolist(),
                "model": "sface_2021dec",
                "threshold": self.similarity_threshold,
                "created_at": datetime.utcnow().isoformat() + "Z"
            }
            file_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
            
            # Add to memory
            self.whitelist_embeddings[name] = embedding
            
            logger.info(f"[FaceRecognitionService] Added to whitelist: {name}")
            return True
            
        except Exception as e:
            logger.error(f"[FaceRecognitionService] Failed to add whitelist: {e}")
            return False
    
    def remove_from_whitelist(self, name: str) -> bool:
        """
        Remove face from whitelist.
        
        Args:
            name: Identifier of face to remove
            
        Returns:
            True if successful
        """
        try:
            # Remove from disk
            file_path = self.whitelist_dir / f"{name}_embedding.json"
            if file_path.exists():
                file_path.unlink()
            
            # Remove from memory
            if name in self.whitelist_embeddings:
                del self.whitelist_embeddings[name]
            
            logger.info(f"[FaceRecognitionService] Removed from whitelist: {name}")
            return True
            
        except Exception as e:
            logger.error(f"[FaceRecognitionService] Failed to remove whitelist: {e}")
            return False
    
    def list_whitelist(self) -> List[Dict[str, Any]]:
        """
        List all whitelisted faces.
        
        Returns:
            List of whitelist entries with metadata
        """
        result = []
        
        for file_path in self.whitelist_dir.glob("*_embedding.json"):
            try:
                data = json.loads(file_path.read_text(encoding="utf-8"))
                result.append({
                    "name": data.get("name", file_path.stem.replace("_embedding", "")),
                    "created_at": data.get("created_at", "unknown"),
                    "model": data.get("model", "sface_2021dec")
                })
            except Exception as e:
                logger.error(f"[FaceRecognitionService] Failed to read {file_path}: {e}")
        
        return result
    
    def extract_embedding(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract face embedding from the largest face in frame.
        
        Args:
            frame: Input frame (BGR)
            
        Returns:
            128-dimensional embedding or None if no face found
        """
        if self.detector is None or self.recognizer is None:
            raise DetectorError(
                message="Face recognition not initialized",
                code=ErrorCode.DETECTOR_NOT_INITIALIZED
            )
        
        try:
            h, w = frame.shape[:2]
            if (w, h) != self.input_size:
                self.detector.setInputSize((w, h))
                self.input_size = (w, h)
            
            # Detect faces
            _, faces = self.detector.detect(frame)
            
            if faces is None or len(faces) == 0:
                return None
            
            # Get largest face
            face = max(faces, key=lambda x: x[2] * x[3])
            
            # Extract embedding
            aligned_face = self.recognizer.alignCrop(frame, face)
            embedding = self.recognizer.feature(aligned_face)
            
            return embedding
            
        except Exception as e:
            logger.error(f"[FaceRecognitionService] Embedding extraction failed: {e}")
            return None
    
    def process_frame(self, frame: np.ndarray, dilate_px: int = 12) -> List[Tuple[int, int, int, int]]:
        """
        Process frame: detect faces, filter whitelist, return boxes to blur.
        
        Args:
            frame: Input frame (BGR)
            dilate_px: Pixels to expand bounding boxes
            
        Returns:
            List of bounding boxes (x, y, x2, y2) for non-whitelisted faces
        """
        if self.detector is None or self.recognizer is None:
            raise DetectorError(
                message="Face recognition not initialized",
                code=ErrorCode.DETECTOR_NOT_INITIALIZED
            )
        
        try:
            h, w = frame.shape[:2]
            if (w, h) != self.input_size:
                self.detector.setInputSize((w, h))
                self.input_size = (w, h)
            
            # 1. Detect all faces
            _, faces = self.detector.detect(frame)
            
            boxes_to_blur = []
            
            if faces is not None:
                for face in faces:
                    # 2. Check if face is whitelisted
                    is_whitelisted = False
                    
                    if len(self.whitelist_embeddings) > 0:
                        try:
                            # Extract embedding
                            aligned_face = self.recognizer.alignCrop(frame, face)
                            embedding = self.recognizer.feature(aligned_face)
                            
                            # Compare with all whitelist embeddings
                            for name, whitelist_emb in self.whitelist_embeddings.items():
                                similarity = self.recognizer.match(
                                    embedding,
                                    whitelist_emb,
                                    cv2.FaceRecognizerSF_FR_COSINE
                                )
                                
                                if similarity > self.similarity_threshold:
                                    is_whitelisted = True
                                    logger.debug(f"Face matched whitelist: {name} (similarity: {similarity:.3f})")
                                    break
                                    
                        except Exception as e:
                            logger.debug(f"Recognition failed for face: {e}")
                    
                    # 3. If not whitelisted, add to blur list
                    if not is_whitelisted:
                        x, y, w_box, h_box = face[:4].astype(int)
                        
                        # Dilate
                        x -= dilate_px
                        y -= dilate_px
                        w_box += 2 * dilate_px
                        h_box += 2 * dilate_px
                        
                        # Clip to frame bounds
                        x = max(0, x)
                        y = max(0, y)
                        x2 = min(w, x + w_box)
                        y2 = min(h, y + h_box)
                        
                        boxes_to_blur.append((x, y, x2, y2))
            
            return boxes_to_blur
            
        except Exception as e:
            logger.error(f"[FaceRecognitionService] Frame processing failed: {e}")
            raise DetectorError(
                message=f"Failed to process frame: {e}",
                code=ErrorCode.DETECTOR_PROCESS_FAILED
            )
    
    def is_initialized(self) -> bool:
        """Check if service is initialized."""
        return self.detector is not None and self.recognizer is not None
    
    def get_info(self) -> Dict[str, Any]:
        """Get service information."""
        return {
            "initialized": self.is_initialized(),
            "detector": "YuNet",
            "recognizer": "SFace",
            "whitelist_count": len(self.whitelist_embeddings),
            "whitelist_names": list(self.whitelist_embeddings.keys()),
            "threshold": self.similarity_threshold,
            "input_size": self.input_size
        }
