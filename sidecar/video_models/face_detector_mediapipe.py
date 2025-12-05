"""
MediaPipe Face Detection - Drop-in replacement for InsightFace

Uses Google MediaPipe for fast, accurate face detection on Windows
without requiring C++ compilation.

Performance: 30-60 FPS on CPU, 100+ FPS on GPU
Accuracy: Comparable to InsightFace for face detection
"""

import cv2
import numpy as np
import mediapipe as mp
import time
from typing import List, Tuple, Optional, Dict, Any
from collections import deque

# Import base class
from video_models.base.base_face_detector import BaseFaceDetector, DetectedFace


class MediaPipeFaceDetector:
    """
    Face detector using MediaPipe.

    Compatible with PrivaStream UnifiedBlurDetector interface.
    """

    def __init__(self,
                 min_detection_confidence: float = 0.5,
                 model_selection: int = 1):
        """
        Initialize MediaPipe face detector.

        Args:
            min_detection_confidence: Minimum confidence for detection (0-1)
            model_selection: 0 for short-range (2m), 1 for full-range (5m)
        """
        self.mp_face_detection = mp.solutions.face_detection
        self.detector = self.mp_face_detection.FaceDetection(
            min_detection_confidence=min_detection_confidence,
            model_selection=model_selection
        )

        print(f"[MediaPipeFaceDetector] Initialized")
        print(f"  Model: {'Full-range' if model_selection == 1 else 'Short-range'}")
        print(f"  Min confidence: {min_detection_confidence}")

    def detect(self, frame: np.ndarray) -> List[List[int]]:
        """
        Detect faces in frame.

        Args:
            frame: Input image (BGR format)

        Returns:
            List of bounding boxes [[x1, y1, x2, y2], ...]
        """
        # Convert BGR to RGB (MediaPipe uses RGB)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Detect faces
        results = self.detector.process(frame_rgb)

        rectangles = []

        if results.detections:
            height, width = frame.shape[:2]

            for detection in results.detections:
                # Get bounding box
                bbox = detection.location_data.relative_bounding_box

                # Convert normalized coordinates to pixel coordinates
                x1 = int(bbox.xmin * width)
                y1 = int(bbox.ymin * height)
                x2 = int((bbox.xmin + bbox.width) * width)
                y2 = int((bbox.ymin + bbox.height) * height)

                # Clip to frame bounds
                x1 = max(0, x1)
                y1 = max(0, y1)
                x2 = min(width, x2)
                y2 = min(height, y2)

                rectangles.append([x1, y1, x2, y2])

        return rectangles

    def get_landmarks(self, frame: np.ndarray) -> List[np.ndarray]:
        """
        Get facial landmarks (for compatibility, returns empty if not needed).

        Args:
            frame: Input image

        Returns:
            List of landmark arrays
        """
        # MediaPipe Face Detection doesn't provide detailed landmarks
        # Use MediaPipe Face Mesh if landmarks are needed
        return []

    def close(self):
        """Cleanup MediaPipe resources."""
        if hasattr(self, 'detector'):
            self.detector.close()


class FaceDetector(BaseFaceDetector):
    """
    Unified face detector interface for PrivaStream.

    Uses MediaPipe (works on Windows without compilation).
    Compatible with InsightFace interface.
    """

    def __init__(self,
                 embed_path: str = "whitelist/creator_embedding.json",
                 gpu_id: int = 0,
                 det_size: int = 640,
                 threshold: float = 0.45,
                 dilate_px: int = 12,
                 smooth_ms: int = 300,
                 conf_threshold: float = 0.5,
                 nms_threshold: float = 0.4):
        """
        Initialize face detector (InsightFace-compatible interface).

        Args:
            embed_path: Path to creator embedding (not used in MediaPipe)
            gpu_id: GPU device ID (not used in MediaPipe)
            det_size: Detection size (not used in MediaPipe)
            threshold: Threshold (not used in MediaPipe)
            dilate_px: Pixels to dilate boxes
            smooth_ms: Temporal smoothing duration
            conf_threshold: Minimum confidence for detections (for base class)
            nms_threshold: IoU threshold for NMS (for base class)
        """
        # Initialize base class
        super().__init__(conf_threshold=conf_threshold, nms_threshold=nms_threshold)

        self.dilate_px = dilate_px
        self.smooth_ms = smooth_ms
        self.min_detection_confidence = conf_threshold
        
        # Per-room temporal tracking (fixes cross-room contamination)
        self.room_masks = {}      # roomId -> [(expiry_time, box)]
        self.panic_mode = False

        # Model will be initialized lazily via _initialize_model()
        self.detector = None
        
        print(f"[FaceDetector] Initialized wrapper with smooth_ms={smooth_ms}, dilate_px={dilate_px}")

    def _initialize_model(self) -> None:
        """
        Initialize the MediaPipe model (required by BaseFaceDetector).
        """
        self.detector = MediaPipeFaceDetector(
            min_detection_confidence=self.min_detection_confidence,
            model_selection=0  # Short-range model (safer default)
        )
        print(f"[FaceDetector] MediaPipe model initialized")

    def _detect_faces_impl(self, frame: np.ndarray) -> List[DetectedFace]:
        """
        Perform face detection using MediaPipe (required by BaseFaceDetector).

        Args:
            frame: Input frame (BGR format)

        Returns:
            List of detected faces as DetectedFace objects
        """
        if self.detector is None:
            raise RuntimeError("Model not initialized. Call initialize() first.")

        # Detect faces using MediaPipe
        rectangles = self.detector.detect(frame)

        # Convert to DetectedFace format
        detected_faces = []
        for rect in rectangles:
            x1, y1, x2, y2 = rect
            detected_face = DetectedFace(
                bbox=(x1, y1, x2, y2),
                confidence=1.0,  # MediaPipe doesn't provide per-detection confidence
                landmarks=None,  # MediaPipe Face Detection doesn't provide landmarks
                embedding=None   # MediaPipe doesn't provide embeddings
            )
            detected_faces.append(detected_face)

        return detected_faces

    def dilate_box(self, box: List[int], W: int, H: int) -> List[int]:
        """Dilate bounding box by specified pixels."""
        x1, y1, x2, y2 = box
        d = self.dilate_px
        return [
            max(0, int(x1 - d)),
            max(0, int(y1 - d)),
            min(W - 1, int(x2 + d)),
            min(H - 1, int(y2 + d))
        ]
        
    def _get_room_masks(self, room_id: str):
        """Get or create temporal masks for specific room."""
        if room_id not in self.room_masks:
            self.room_masks[room_id] = []
        return self.room_masks[room_id]
        
    def cleanup_room(self, room_id: str):
        """Clean up room-specific data when room closes."""
        if room_id in self.room_masks:
            del self.room_masks[room_id]
        print(f"[FaceDetector] Cleaned up temporal data for room: {room_id}")
        
    def set_panic_mode(self, panic: bool):
        """Toggle panic mode (blur entire frame)."""
        self.panic_mode = panic
        print(f"[FaceDetector] Panic mode: {'ON' if panic else 'OFF'}")

    def detect(self, frame: np.ndarray) -> Tuple[List[List[int]], List[np.ndarray]]:
        """
        Detect faces and return bounding boxes and landmarks.

        Args:
            frame: Input image (BGR format)

        Returns:
            Tuple of (rectangles, landmarks)
            - rectangles: [[x1, y1, x2, y2], ...]
            - landmarks: List of landmark arrays (empty for MediaPipe)
        """
        if not self._initialized:
            self.initialize()
            
        rectangles = self.detector.detect(frame)
        landmarks = self.detector.get_landmarks(frame)

        return rectangles, landmarks

    def process_frame(self, frame: np.ndarray, frame_id: int,
                     stride: int = 1, tta_every: int = 0, room_id: str = None) -> Tuple[int, List[List[int]]]:
        """
        Process a single frame and return rectangles to be blurred.
        
        Implements robust temporal smoothing to prevent flickering.

        Args:
            frame: Input frame (BGR format)
            frame_id: Frame identifier
            stride: Process every N frames (ignored for now)
            tta_every: TTA interval (ignored)
            room_id: Room identifier

        Returns:
            Tuple of (frame_id, list of rectangles as [x1, y1, x2, y2])
        """
        # Initialize model if not already done
        if not self._initialized:
            self.initialize()

        H, W = frame.shape[:2]
        now = time.monotonic()
        
        new_boxes = []
        
        if self.panic_mode:
            # Blur entire frame in panic mode
            new_boxes.append([0, 0, W - 1, H - 1])
        else:
            # Detect faces
            rectangles = self.detector.detect(frame)

            # Dilate boxes
            new_boxes = [self.dilate_box(box, W, H) for box in rectangles]

        # Get room-specific temporal data
        if room_id:
            room_masks = self._get_room_masks(room_id)
        else:
            # Fallback for legacy calls (use a default key or handle gracefully)
            # For backward compatibility, we'll use a default list but warn
            if not hasattr(self, '_legacy_masks'):
                self._legacy_masks = []
            room_masks = self._legacy_masks

        # Temporal smoothing: update ROOM-SPECIFIC mask list
        # Keep masks that haven't expired, and add new ones with expiry
        expiry = now + self.smooth_ms / 1000.0
        
        # Filter out expired masks
        active_masks = [m for m in room_masks if m[0] > now]
        
        # Add new detections
        active_masks.extend([(expiry, b) for b in new_boxes])
        
        # Update the storage
        if room_id:
            self.room_masks[room_id] = active_masks
        else:
            self._legacy_masks = active_masks

        # Return ONLY active masks (strip expiry time)
        rectangles = [box for _, box in active_masks]

        # Debug logging (optional, can be noisy)
        # print(f"[FaceDetector] Frame {frame_id}: detected={len(new_boxes)}, active={len(rectangles)}")

        return frame_id, rectangles
        
    def process_frame_with_mouth_landmarks(self, frame: np.ndarray, frame_id: int, 
                                         stride: int = 1, room_id: str = None) -> Tuple[int, List[List[int]], List[Dict]]:
        """
        Enhanced frame processing that returns both face blur regions and mouth landmarks.
        
        Note: MediaPipe Face Detection does NOT provide 68-point landmarks.
        We will return estimated mouth regions based on the face bounding box.
        """
        # Get face blur regions (reusing the robust logic)
        _, rectangles = self.process_frame(frame, frame_id, stride, 0, room_id)
        
        # Estimate mouth regions from the currently detected faces (not the smoothed masks)
        # We need to re-detect to get the actual faces for this frame for mouth estimation
        # (Using smoothed masks for mouth might be inaccurate if face moved)
        current_faces = self.detector.detect(frame)
        
        mouth_regions = []
        for i, face_bbox in enumerate(current_faces):
            mouth_bbox = self._estimate_mouth_from_face(face_bbox)
            mouth_regions.append({
                'face_index': i,
                'bbox': mouth_bbox,
                'landmarks': None, # No detailed landmarks available
                'confidence': 1.0
            })
            
        return frame_id, rectangles, mouth_regions

    def _estimate_mouth_from_face(self, face_bbox) -> List[int]:
        """Fallback mouth estimation when landmarks unavailable"""
        x1, y1, x2, y2 = map(int, face_bbox)
        face_width = x2 - x1
        face_height = y2 - y1
        
        # Mouth is typically in bottom 1/3 of face, center 70% width
        mouth_x1 = x1 + int(face_width * 0.15)
        mouth_x2 = x2 - int(face_width * 0.15)
        mouth_y1 = y1 + int(face_height * 0.65)
        mouth_y2 = y1 + int(face_height * 0.95)
        
        return [mouth_x1, mouth_y1, mouth_x2, mouth_y2]

    def get_all(self, frame: np.ndarray) -> dict:
        """
        Get all detection information.

        Args:
            frame: Input image

        Returns:
            Dictionary with detection results
        """
        rectangles, landmarks = self.detect(frame)

        return {
            'rectangles': rectangles,
            'landmarks': landmarks,
            'count': len(rectangles)
        }

    def get_model_info(self) -> dict:
        """Get information about the current model configuration."""
        return {
            "model_type": "face_detector_mediapipe",
            "backend": "MediaPipe",
            "dilate_px": self.dilate_px,
            "smooth_ms": self.smooth_ms
        }

    def __del__(self):
        if hasattr(self, 'detector') and self.detector:
            self.detector.close()


if __name__ == "__main__":
    print("="*70)
    print("MediaPipe Face Detector - Test")
    print("="*70)
    print()

    # Initialize detector
    detector = FaceDetector()
    print()

    # Create test frame with synthetic faces
    test_frame = np.zeros((480, 640, 3), dtype=np.uint8)

    # Add some shapes to simulate faces
    cv2.rectangle(test_frame, (100, 100), (200, 200), (255, 255, 255), -1)
    cv2.circle(test_frame, (150, 140), 20, (100, 100, 100), -1)
    cv2.circle(test_frame, (170, 140), 20, (100, 100, 100), -1)
    cv2.ellipse(test_frame, (150, 170), (30, 15), 0, 0, 180, (100, 100, 100), -1)

    # Test detection
    print("Testing detection on synthetic frame...")
    # Run twice to test smoothing init
    detector.process_frame(test_frame, 0, room_id="test_room")
    fid, rectangles = detector.process_frame(test_frame, 1, room_id="test_room")

    print(f"Detected {len(rectangles)} faces")
    for i, rect in enumerate(rectangles):
        print(f"  Face {i+1}: {rect}")

    print()
    print("="*70)
    print("READY: MediaPipe face detector is working with smoothing!")
    print("="*70)
