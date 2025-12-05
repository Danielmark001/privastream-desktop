"""
SCRFD (Sample and Computation Redistribution for Efficient Face Detection)

SCRFD is optimized for speed:
- 2.5GF (500FP model) - Ultra fast, 100+ FPS
- 2.5x faster than RetinaFace
- 95%+ accuracy on WIDER Face
- Designed specifically for real-time applications

Expected: 15ms -> 3-5ms (3-5x speedup)
Total pipeline: 66 FPS -> 150+ FPS
"""

import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional
import onnxruntime as ort
import time


class SCRFDFaceDetector:
    """
    SCRFD face detector for maximum speed.

    Uses SCRFD-500M or SCRFD-2.5G models optimized for real-time detection.
    """

    def __init__(self,
                 model_path: Optional[str] = None,
                 model_variant: str = "500m",  # "500m" (fastest) or "2.5g" (balanced)
                 input_size: Tuple[int, int] = (640, 640),
                 conf_threshold: float = 0.5,
                 nms_threshold: float = 0.4,
                 use_gpu: bool = True,
                 dilate_px: int = 12):
        """
        Initialize SCRFD detector.

        Args:
            model_path: Path to SCRFD ONNX model
            model_variant: "500m" (fastest, 2.5GF) or "2.5g" (balanced, 2.5GF)
            input_size: Input size for detector
            conf_threshold: Confidence threshold
            nms_threshold: NMS IoU threshold
            use_gpu: Use GPU acceleration
            dilate_px: Dilation pixels for boxes
        """
        self.input_size = input_size
        self.conf_threshold = conf_threshold
        self.nms_threshold = nms_threshold
        self.dilate_px = dilate_px

        # Auto-download model if not provided
        if model_path is None:
            model_path = self._get_scrfd_model(model_variant)

        # Initialize ONNX Runtime session
        self.session = self._create_session(model_path, use_gpu)

        # Get input/output names
        self.input_name = self.session.get_inputs()[0].name
        self.output_names = [out.name for out in self.session.get_outputs()]

        # Precompute anchors for faster inference
        self._init_anchors()

        print(f"[SCRFDFaceDetector] Initialized")
        print(f"  Model: {model_variant}")
        print(f"  Input size: {input_size}")
        print(f"  Backend: {'CUDA' if use_gpu else 'CPU'}")
        print(f"  Expected latency: 3-5ms")

    def _get_scrfd_model(self, variant: str) -> Path:
        """Get SCRFD model path (download if needed)"""
        model_dir = Path("models/weights/face")
        model_dir.mkdir(parents=True, exist_ok=True)

        model_files = {
            "500m": "scrfd_500m_bnkps.onnx",
            "2.5g": "scrfd_2.5g_bnkps.onnx"
        }

        model_file = model_files.get(variant, model_files["500m"])
        model_path = model_dir / model_file

        if model_path.exists():
            print(f"[SCRFDFaceDetector] Using existing model: {model_path}")
            return model_path

        # Download from InsightFace model zoo
        urls = {
            "500m": "https://github.com/deepinsight/insightface/releases/download/v0.7/scrfd_500m_bnkps.onnx",
            "2.5g": "https://github.com/deepinsight/insightface/releases/download/v0.7/scrfd_2.5g_bnkps.onnx"
        }

        url = urls.get(variant, urls["500m"])

        print(f"[SCRFDFaceDetector] Downloading {variant} model...")
        print(f"  URL: {url}")
        print(f"  Destination: {model_path}")

        try:
            import urllib.request
            urllib.request.urlretrieve(url, model_path)
            size_mb = model_path.stat().st_size / (1024 * 1024)
            print(f"[SCRFDFaceDetector] Model downloaded ({size_mb:.1f} MB)")
            return model_path
        except Exception as e:
            print(f"[SCRFDFaceDetector][ERROR] Download failed: {e}")
            print(f"[SCRFDFaceDetector] Please download manually from: {url}")
            raise

    def _create_session(self, model_path: Path, use_gpu: bool):
        """Create ONNX Runtime session with optimal settings"""
        providers = []

        if use_gpu:
            # Try CUDA provider first
            if 'CUDAExecutionProvider' in ort.get_available_providers():
                providers.append(('CUDAExecutionProvider', {
                    'device_id': 0,
                    'arena_extend_strategy': 'kNextPowerOfTwo',
                    'cudnn_conv_algo_search': 'EXHAUSTIVE',
                    'do_copy_in_default_stream': True,
                }))
                print("[SCRFDFaceDetector] Using CUDA")

        providers.append('CPUExecutionProvider')

        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.intra_op_num_threads = 4

        session = ort.InferenceSession(
            str(model_path),
            providers=providers,
            sess_options=sess_options
        )

        return session

    def _init_anchors(self):
        """Initialize anchor points for detection"""
        # SCRFD uses anchor-free detection with feature pyramid
        # Precompute for common strides
        self.fmc = 3  # Feature map count
        self._anchor_cache = {}

        strides = [8, 16, 32]
        for stride in strides:
            h = self.input_size[1] // stride
            w = self.input_size[0] // stride
            anchors = self._make_anchors(h, w, stride)
            self._anchor_cache[stride] = anchors

    def _make_anchors(self, h: int, w: int, stride: int):
        """Generate anchor points for a feature map"""
        yv, xv = np.meshgrid(np.arange(h), np.arange(w), indexing='ij')
        anchors = np.stack([xv, yv], axis=-1).reshape(-1, 2).astype(np.float32)
        anchors = (anchors + 0.5) * stride
        return anchors

    def preprocess(self, frame: np.ndarray) -> Tuple[np.ndarray, float]:
        """Preprocess frame for SCRFD"""
        h, w = frame.shape[:2]
        im_ratio = float(h) / w
        model_ratio = self.input_size[1] / self.input_size[0]

        if im_ratio > model_ratio:
            new_h = self.input_size[1]
            new_w = int(new_h / im_ratio)
        else:
            new_w = self.input_size[0]
            new_h = int(new_w * im_ratio)

        det_scale = float(new_h) / h

        resized = cv2.resize(frame, (new_w, new_h))

        # Pad to input size
        det_img = np.zeros((self.input_size[1], self.input_size[0], 3), dtype=np.uint8)
        det_img[:new_h, :new_w, :] = resized

        # Normalize and transpose to CHW
        det_img = det_img.astype(np.float32)
        det_img = (det_img - 127.5) / 128.0
        det_img = det_img.transpose(2, 0, 1)
        det_img = np.expand_dims(det_img, axis=0)

        return det_img, det_scale

    def postprocess(self, outputs, det_scale: float, frame_shape: Tuple[int, int]):
        """Post-process SCRFD outputs"""
        # SCRFD outputs: scores, boxes, keypoints
        scores_list = []
        bboxes_list = []

        for idx, stride in enumerate([8, 16, 32]):
            scores = outputs[idx]
            bbox_preds = outputs[idx + self.fmc]
            kps_preds = outputs[idx + self.fmc * 2]

            height = self.input_size[1] // stride
            width = self.input_size[0] // stride
            anchors = self._anchor_cache[stride]

            # Reshape outputs
            scores = scores.reshape(-1, 1)
            bbox_preds = bbox_preds.reshape(-1, 4)

            # Filter by confidence
            pos_inds = np.where(scores[:, 0] > self.conf_threshold)[0]

            if len(pos_inds) == 0:
                continue

            scores_filtered = scores[pos_inds]
            bbox_preds_filtered = bbox_preds[pos_inds]
            anchors_filtered = anchors[pos_inds]

            # Decode boxes
            x1 = anchors_filtered[:, 0] - bbox_preds_filtered[:, 0] * stride
            y1 = anchors_filtered[:, 1] - bbox_preds_filtered[:, 1] * stride
            x2 = anchors_filtered[:, 0] + bbox_preds_filtered[:, 2] * stride
            y2 = anchors_filtered[:, 1] + bbox_preds_filtered[:, 3] * stride

            bboxes = np.stack([x1, y1, x2, y2], axis=1)

            scores_list.append(scores_filtered)
            bboxes_list.append(bboxes)

        if len(scores_list) == 0:
            return []

        scores = np.vstack(scores_list)
        bboxes = np.vstack(bboxes_list)

        # NMS
        keep = self._nms(bboxes, scores[:, 0], self.nms_threshold)

        bboxes = bboxes[keep]
        scores = scores[keep]

        # Scale back to original image
        bboxes /= det_scale

        # Convert to polygons
        polygons = []
        h, w = frame_shape

        for bbox in bboxes:
            x1, y1, x2, y2 = bbox.astype(int)

            # Dilate
            x1 -= self.dilate_px
            y1 -= self.dilate_px
            x2 += self.dilate_px
            y2 += self.dilate_px

            # Clip
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(w, x2)
            y2 = min(h, y2)

            polygon = np.array([
                [x1, y1],
                [x2, y1],
                [x2, y2],
                [x1, y2]
            ], dtype=np.int32)

            polygons.append(polygon)

        return polygons

    def _nms(self, boxes, scores, threshold):
        """Non-maximum suppression"""
        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 2]
        y2 = boxes[:, 3]

        areas = (x2 - x1 + 1) * (y2 - y1 + 1)
        order = scores.argsort()[::-1]

        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(i)

            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])

            w = np.maximum(0.0, xx2 - xx1 + 1)
            h = np.maximum(0.0, yy2 - yy1 + 1)
            inter = w * h

            iou = inter / (areas[i] + areas[order[1:]] - inter)

            inds = np.where(iou <= threshold)[0]
            order = order[inds + 1]

        return keep

    def process_frame(self, frame: np.ndarray, **kwargs) -> List[np.ndarray]:
        """
        Detect faces in frame.

        Args:
            frame: Input frame (BGR)

        Returns:
            List of face polygons
        """
        # Preprocess
        input_blob, det_scale = self.preprocess(frame)

        # Inference
        outputs = self.session.run(self.output_names, {self.input_name: input_blob})

        # Postprocess
        polygons = self.postprocess(outputs, det_scale, frame.shape[:2])

        return polygons


def benchmark_scrfd():
    """Benchmark SCRFD performance"""
    print("="*70)
    print("SCRFD FACE DETECTOR BENCHMARK")
    print("="*70)

    # Create test frame with synthetic face
    test_frame = np.random.randint(0, 255, (640, 480, 3), dtype=np.uint8)
    cv2.ellipse(test_frame, (320, 240), (80, 100), 0, 0, 360, (200, 200, 200), -1)
    cv2.circle(test_frame, (290, 220), 10, (50, 50, 50), -1)
    cv2.circle(test_frame, (350, 220), 10, (50, 50, 50), -1)

    try:
        detector = SCRFDFaceDetector(model_variant="500m", use_gpu=True)

        # Warmup
        print("\nWarming up (10 iterations)...")
        for _ in range(10):
            _ = detector.process_frame(test_frame)

        # Benchmark
        print("Benchmarking (50 iterations)...")
        times = []
        iterations = 50

        for i in range(iterations):
            start = time.perf_counter()
            faces = detector.process_frame(test_frame)
            end = time.perf_counter()
            times.append((end - start) * 1000)

            if (i + 1) % 10 == 0:
                print(f"  Progress: {i+1}/{iterations}")

        avg_time = np.mean(times)
        std_time = np.std(times)

        print("\n" + "="*70)
        print("RESULTS")
        print("="*70)
        print(f"SCRFD-500M:  {avg_time:.2f} ms ({1000/avg_time:.1f} FPS)")
        print(f"Std Dev:     {std_time:.2f} ms")
        print(f"Faces:       {len(faces)}")
        print("\nComparison:")
        print(f"  InsightFace: 15.00 ms (66.7 FPS)")
        print(f"  SCRFD:       {avg_time:.2f} ms ({1000/avg_time:.1f} FPS)")
        print(f"  Speedup:     {15.0/avg_time:.2f}x")
        print("="*70)

        return avg_time

    except Exception as e:
        print(f"\n[ERROR] Benchmark failed: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    benchmark_scrfd()
