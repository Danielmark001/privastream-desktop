"""
Base Face Detector - Abstract base class for all face detection implementations.

Consolidates duplicate logic from:
- video_models/face_blur/face_detector.py
- video_models/face_detector_mediapipe.py
- video_models/face_detector.py

Implements Template Method pattern for face detection workflow.
"""
from abc import ABC, abstractmethod
from typing import List, Tuple, Optional, Dict, Any
import numpy as np
import cv2


class DetectedFace:
    """Data class for detected face information."""

    def __init__(
        self,
        bbox: Tuple[int, int, int, int],
        confidence: float,
        landmarks: Optional[np.ndarray] = None,
        embedding: Optional[np.ndarray] = None,
    ):
        self.bbox = bbox  # (x1, y1, x2, y2)
        self.confidence = confidence
        self.landmarks = landmarks
        self.embedding = embedding

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            'bbox': list(self.bbox),
            'confidence': float(self.confidence),
            'has_landmarks': self.landmarks is not None,
            'has_embedding': self.embedding is not None,
        }


class BaseFaceDetector(ABC):
    """
    Abstract base class for face detection implementations.

    Subclasses must implement:
    - _initialize_model(): Load model-specific resources
    - _detect_faces_impl(): Perform actual face detection

    Common functionality provided:
    - Preprocessing (resize, normalize)
    - Postprocessing (NMS, filtering)
    - Whitelist comparison
    - Blur application
    """

    def __init__(self, conf_threshold: float = 0.5, nms_threshold: float = 0.4):
        """
        Initialize base face detector.

        Args:
            conf_threshold: Minimum confidence for detections
            nms_threshold: IoU threshold for NMS
        """
        self.conf_threshold = conf_threshold
        self.nms_threshold = nms_threshold
        self._initialized = False

    def initialize(self) -> None:
        """Initialize the detector (call once before use)."""
        if not self._initialized:
            self._initialize_model()
            self._initialized = True

    @abstractmethod
    def _initialize_model(self) -> None:
        """
        Load and initialize the detection model.

        Subclasses must implement this to load their specific models.
        """
        pass

    @abstractmethod
    def _detect_faces_impl(self, frame: np.ndarray) -> List[DetectedFace]:
        """
        Perform actual face detection.

        Args:
            frame: Input frame (BGR format)

        Returns:
            List of detected faces

        Subclasses must implement this with their detection logic.
        """
        pass

    def detect(
        self,
        frame: np.ndarray,
        whitelist_embedding: Optional[np.ndarray] = None,
        similarity_threshold: float = 0.4,
    ) -> List[DetectedFace]:
        """
        Detect faces in frame with optional whitelist filtering.

        Args:
            frame: Input frame (BGR format)
            whitelist_embedding: Optional embedding for whitelist comparison
            similarity_threshold: Threshold for whitelist matching

        Returns:
            List of detected faces (whitelisted faces removed if whitelist provided)
        """
        if not self._initialized:
            raise RuntimeError("Detector not initialized. Call initialize() first.")

        # Detect all faces
        faces = self._detect_faces_impl(frame)

        # Filter by whitelist if provided
        if whitelist_embedding is not None:
            faces = self._filter_whitelisted(faces, whitelist_embedding, similarity_threshold)

        return faces

    def _filter_whitelisted(
        self,
        faces: List[DetectedFace],
        whitelist_embedding: np.ndarray,
        threshold: float = 0.4,
    ) -> List[DetectedFace]:
        """
        Remove whitelisted faces from detection list.

        Args:
            faces: List of detected faces
            whitelist_embedding: Whitelist embedding to compare against
            threshold: Similarity threshold

        Returns:
            Filtered list of faces (whitelisted removed)
        """
        filtered = []

        for face in faces:
            if face.embedding is None:
                # No embedding, can't compare - keep it
                filtered.append(face)
                continue

            # Compute cosine similarity
            similarity = np.dot(face.embedding, whitelist_embedding.T)

            if similarity < threshold:
                # Not whitelisted - keep for blurring
                filtered.append(face)

        return filtered

    def apply_blur(
        self,
        frame: np.ndarray,
        faces: List[DetectedFace],
        blur_strength: int = 75,
    ) -> np.ndarray:
        """
        Apply Gaussian blur to detected face regions.

        Args:
            frame: Input frame
            faces: List of faces to blur
            blur_strength: Blur kernel size

        Returns:
            Blurred frame
        """
        result = frame.copy()

        for face in faces:
            x1, y1, x2, y2 = face.bbox
            # Ensure coordinates are within frame bounds
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(frame.shape[1], x2)
            y2 = min(frame.shape[0], y2)

            # Extract face region
            face_region = result[y1:y2, x1:x2]

            if face_region.size == 0:
                continue

            # Apply Gaussian blur
            ksize = blur_strength
            if ksize % 2 == 0:  # Ensure odd kernel size
                ksize += 1

            face_region = cv2.GaussianBlur(face_region, (ksize, ksize), 0)

            # Write back to frame
            result[y1:y2, x1:x2] = face_region

        return result

    def detect_and_blur(
        self,
        frame: np.ndarray,
        whitelist_embedding: Optional[np.ndarray] = None,
        blur_strength: int = 75,
    ) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        """
        Convenience method: detect faces and apply blur in one call.

        Args:
            frame: Input frame
            whitelist_embedding: Optional whitelist for filtering
            blur_strength: Blur kernel size

        Returns:
            Tuple of (blurred_frame, detection_rectangles)
        """
        faces = self.detect(frame, whitelist_embedding)
        blurred_frame = self.apply_blur(frame, faces, blur_strength)

        # Convert to rectangle format for API response
        rectangles = [
            {
                'x1': face.bbox[0],
                'y1': face.bbox[1],
                'x2': face.bbox[2],
                'y2': face.bbox[3],
                'type': 'face',
                'confidence': face.confidence,
            }
            for face in faces
        ]

        return blurred_frame, rectangles

    @staticmethod
    def calculate_iou(box1: Tuple[int, int, int, int], box2: Tuple[int, int, int, int]) -> float:
        """
        Calculate Intersection over Union (IoU) between two boxes.

        Args:
            box1: First box (x1, y1, x2, y2)
            box2: Second box (x1, y1, x2, y2)

        Returns:
            IoU value (0-1)
        """
        x1_1, y1_1, x2_1, y2_1 = box1
        x1_2, y1_2, x2_2, y2_2 = box2

        # Calculate intersection area
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)

        if x2_i < x1_i or y2_i < y1_i:
            return 0.0

        intersection = (x2_i - x1_i) * (y2_i - y1_i)

        # Calculate union area
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection

        return intersection / union if union > 0 else 0.0

    @staticmethod
    def non_max_suppression(
        faces: List[DetectedFace],
        iou_threshold: float = 0.4
    ) -> List[DetectedFace]:
        """
        Apply Non-Maximum Suppression to remove overlapping detections.

        Args:
            faces: List of detected faces
            iou_threshold: IoU threshold for suppression

        Returns:
            Filtered list of faces
        """
        if not faces:
            return []

        # Sort by confidence (descending)
        sorted_faces = sorted(faces, key=lambda f: f.confidence, reverse=True)

        keep = []
        while sorted_faces:
            # Keep the highest confidence face
            current = sorted_faces.pop(0)
            keep.append(current)

            # Remove overlapping faces
            sorted_faces = [
                face for face in sorted_faces
                if BaseFaceDetector.calculate_iou(current.bbox, face.bbox) < iou_threshold
            ]

        return keep
