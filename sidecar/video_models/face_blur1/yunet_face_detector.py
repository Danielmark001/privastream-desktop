"""
Lightweight YuNet Face Detector for High FPS

YuNet is a lightweight CNN face detector from OpenCV:
- 5-10x faster than InsightFace buffalo_s
- Built into OpenCV (no extra dependencies)
- ~2-3ms inference on 640x640 images
- 95%+ accuracy on WIDER Face

Expected performance: 15ms -> 2-3ms (5-10x speedup)
Total pipeline: 66 FPS -> 90-120 FPS
"""

import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional, Dict, Any
import time
import json


class YuNetFaceDetector:
    """
    Lightweight face detector using OpenCV's YuNet model.

    Drop-in replacement for InsightFace with significant speed improvements.
    """

    def __init__(self,
                 model_path: Optional[str] = None,
                 embed_path: str = "whitelist/creator_embedding.json",
                 gpu_id: int = 0,
                 input_size: Tuple[int, int] = (1280, 720),
                 conf_threshold: float = 0.6,
                 nms_threshold: float = 0.3,
                 top_k: int = 5000,
                 dilate_px: int = 12,
                 smooth_ms: int = 300):
        """
        Initialize YuNet face detector.

        Args:
            model_path: Path to YuNet ONNX model (auto-download if None)
            embed_path: Path to creator embedding (for whitelist)
            gpu_id: GPU device ID (0 for GPU, -1 for CPU)
            input_size: Model input size (width, height)
            conf_threshold: Confidence threshold for detections
            nms_threshold: NMS threshold
            top_k: Maximum number of detections before NMS
            dilate_px: Pixels to dilate detection boxes
            smooth_ms: Temporal smoothing duration
        """
        self.embed_path = embed_path
        self.dilate_px = dilate_px
        self.smooth_ms = smooth_ms
        self.input_size = input_size
        self.conf_threshold = conf_threshold

        # Load creator embedding for whitelist (if using face recognition)
        self.creator_embedding = self._load_embedding(embed_path)

        # Initialize SFace recognizer
        self.recognizer = self._init_sface(gpu_id)
        
        print(f"[YuNetFaceDetector] Initialized")
        print(f"  Detector: {model_path if model_path else 'auto-download'}")
        print(f"  Recognizer: SFace (OpenCV)")
        print(f"  Input size: {input_size}")
        print(f"  Backend: {'CUDA' if self.use_cuda else 'CPU'}")

    def _init_yunet(self, model_path, input_size, conf_threshold, nms_threshold, top_k):
        """Initialize YuNet detector"""
        if model_path is None:
            model_path = self._download_model(
                "face_detection_yunet_2023mar.onnx",
                "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
            )

        self.detector = cv2.FaceDetectorYN.create(
            model=str(model_path),
            config="",
            input_size=input_size,
            score_threshold=conf_threshold,
            nms_threshold=nms_threshold,
            top_k=top_k,
            backend_id=cv2.dnn.DNN_BACKEND_DEFAULT,
            target_id=cv2.dnn.DNN_TARGET_CPU
        )

    def _init_sface(self, gpu_id):
        """Initialize SFace recognizer"""
        model_path = self._download_model(
            "face_recognition_sface_2021dec.onnx",
            "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
        )
        
        recognizer = cv2.FaceRecognizerSF.create(
            model=str(model_path),
            config="",
            backend_id=cv2.dnn.DNN_BACKEND_DEFAULT,
            target_id=cv2.dnn.DNN_TARGET_CPU
        )
        
        # Setup CUDA for recognizer if available
        if gpu_id >= 0 and cv2.cuda.getCudaEnabledDeviceCount() > 0:
            recognizer.setBackendAndTarget(cv2.dnn.DNN_BACKEND_CUDA, cv2.dnn.DNN_TARGET_CUDA)
            
        return recognizer

    def _download_model(self, filename: str, url: str) -> Path:
        """Download model from OpenCV zoo"""
        model_dir = Path("models/weights/face")
        model_dir.mkdir(parents=True, exist_ok=True)
        model_path = model_dir / filename

        if model_path.exists():
            return model_path

        import urllib.request
        print(f"[YuNetFaceDetector] Downloading {filename}...")
        try:
            urllib.request.urlretrieve(url, model_path)
            print(f"[YuNetFaceDetector] Downloaded {filename}")
            return model_path
        except Exception as e:
            print(f"[YuNetFaceDetector][ERROR] Failed to download {filename}: {e}")
            raise

    # ... (keep _setup_cuda and _load_embedding) ...

    def process_frame(self, frame: np.ndarray, frame_id: int = 0,
                     stride: int = 1, tta_every: int = 0,
                     room_id: str = None) -> Tuple[int, List[List[int]], List[np.ndarray]]:
        """
        Process frame: Detect -> Recognize -> Return boxes to blur.
        """
        h, w = frame.shape[:2]
        if (w, h) != self.input_size:
            self.detector.setInputSize((w, h))
            self.input_size = (w, h)

        # 1. Detect
        _, faces = self.detector.detect(frame)
        
        rectangles = []
        ellipses = []

        if faces is not None:
            for face in faces:
                # 2. Recognize (if whitelist exists)
                is_creator = False
                if self.creator_embedding is not None:
                    try:
                        # Align face
                        aligned_face = self.recognizer.alignCrop(frame, face)
                        # Extract feature
                        feat = self.recognizer.feature(aligned_face)
                        # Match (Cosine Similarity)
                        score = self.recognizer.match(feat, self.creator_embedding, cv2.FaceRecognizerSF_FR_COSINE)
                        
                        # Threshold (0.363 is standard for SFace)
                        if score > 0.363:
                            is_creator = True
                    except Exception as e:
                        # print(f"Recognition failed: {e}")
                        pass

                # If it's the creator, SKIP blurring
                if is_creator:
                    continue

                # Otherwise, add to blur list
                x, y, w_box, h_box = face[:4].astype(int)
                
                # Dilate
                x -= self.dilate_px
                y -= self.dilate_px
                w_box += 2 * self.dilate_px
                h_box += 2 * self.dilate_px

                # Clip
                x = max(0, x)
                y = max(0, y)
                w_box = min(w - x, w_box)
                h_box = min(h - y, h_box)

                rectangles.append([x, y, x + w_box, y + h_box])
                
                # Ellipse (simplified)
                ellipses.append(np.array([
                    [x, y], [x + w_box, y], [x + w_box, y + h_box], [x, y + h_box]
                ], dtype=np.int32))

        return frame_id, rectangles, ellipses

    def extract_embedding(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract face embedding from the largest face in the frame.
        
        Args:
            frame: Input frame (BGR)
            
        Returns:
            Embedding vector (128-d) or None if no face found
        """
        h, w = frame.shape[:2]
        if (w, h) != self.input_size:
            self.detector.setInputSize((w, h))
            self.input_size = (w, h)
            
        _, faces = self.detector.detect(frame)
        
        if faces is not None and len(faces) > 0:
            # Get largest face
            face = max(faces, key=lambda x: x[2] * x[3])
            
            # Extract embedding
            try:
                aligned_face = self.recognizer.alignCrop(frame, face)
                return self.recognizer.feature(aligned_face)
            except Exception as e:
                print(f"[YuNetFaceDetector] Embedding extraction failed: {e}")
                return None
                
        return None

    def reload_embedding(self) -> bool:
        """Reload creator embedding from disk"""
        try:
            obj = json.loads(Path(self.embed_path).read_text(encoding="utf-8"))
            self.creator_embedding = np.array(obj["embedding"], dtype=float)
            print("[YuNetFaceDetector] Reloaded embedding from disk")
            return True
        except Exception as e:
            print(f"[YuNetFaceDetector][WARN] Reload failed: {e}")
            return False

    def set_dynamic_embedding(self, embedding: np.ndarray) -> bool:
        """Set creator embedding dynamically"""
        try:
            self.creator_embedding = embedding
            print("[YuNetFaceDetector] Updated embedding dynamically")
            return True
        except Exception as e:
            print(f"[YuNetFaceDetector][WARN] Dynamic embedding update failed: {e}")
            return False

    def cleanup_room(self, room_id: str) -> None:
        """Clean up room-specific tracking data"""
        if room_id in self.room_masks:
            del self.room_masks[room_id]
        if room_id in self.room_vote_bufs:
            del self.room_vote_bufs[room_id]
        print(f"[YuNetFaceDetector] Cleaned up room: {room_id}")

    def process_frame_with_mouth_landmarks(self, frame: np.ndarray, frame_id: int,
                                         stride: int = 1, room_id: str = None) -> Tuple[int, List[List[int]], List[Dict]]:
        """
        Enhanced frame processing that returns both face blur regions and mouth landmarks.

        Note: YuNet doesn't provide detailed landmarks, so mouth_regions will be empty.
        Use InsightFace detector if mouth landmarks are needed.

        Returns:
            Tuple of (frame_id, rectangles, mouth_regions)
        """
        frame_id_result, rectangles, _ = self.process_frame(frame, frame_id, stride, room_id=room_id)
        return frame_id_result, rectangles, []  # Empty mouth regions


def benchmark_yunet_vs_insightface():
    """Benchmark YuNet against InsightFace"""
    import time

    print("="*70)
    print("YUNET VS INSIGHTFACE BENCHMARK")
    print("="*70)

    # Create test frame
    test_frame = np.random.randint(0, 255, (640, 480, 3), dtype=np.uint8)

    # Add synthetic face (white oval)
    cv2.ellipse(test_frame, (320, 240), (80, 100), 0, 0, 360, (200, 200, 200), -1)
    cv2.circle(test_frame, (290, 220), 10, (50, 50, 50), -1)  # Left eye
    cv2.circle(test_frame, (350, 220), 10, (50, 50, 50), -1)  # Right eye

    iterations = 50

    # Benchmark YuNet
    print("\n[1/2] Benchmarking YuNet...")
    yunet = YuNetFaceDetector()

    yunet_times = []
    for i in range(iterations):
        start = time.perf_counter()
        faces = yunet.process_frame(test_frame)
        end = time.perf_counter()
        yunet_times.append((end - start) * 1000)

        if (i + 1) % 10 == 0:
            print(f"  Progress: {i+1}/{iterations}")

    yunet_avg = np.mean(yunet_times[10:])  # Skip warmup
    yunet_std = np.std(yunet_times[10:])

    print(f"\nYuNet Performance:")
    print(f"  Average: {yunet_avg:.2f} ms")
    print(f"  Std Dev: {yunet_std:.2f} ms")
    print(f"  FPS: {1000/yunet_avg:.1f}")
    print(f"  Faces detected: {len(faces)}")

    # Note: InsightFace benchmark would require the actual model
    print("\nInsightFace (expected from documentation):")
    print(f"  Average: 15.00 ms")
    print(f"  FPS: 66.7")

    speedup = 15.0 / yunet_avg

    print("\n" + "="*70)
    print("BENCHMARK RESULTS")
    print("="*70)
    print(f"YuNet:       {yunet_avg:.2f} ms ({1000/yunet_avg:.1f} FPS)")
    print(f"InsightFace: 15.00 ms (66.7 FPS)")
    print(f"Speedup:     {speedup:.2f}x faster")
    print("="*70)

    return {
        'yunet_ms': yunet_avg,
        'insightface_ms': 15.0,
        'speedup': speedup
    }


if __name__ == "__main__":
    # Run benchmark
    results = benchmark_yunet_vs_insightface()

    print("\nExpected Pipeline Impact:")
    print(f"  Current: 66 FPS (15ms face detection)")
    print(f"  With YuNet: ~{1000 / (15 - 15 + results['yunet_ms']):.0f} FPS ({results['yunet_ms']:.1f}ms face detection)")
    print(f"  Improvement: {speedup:.1f}x overall speedup")
