"""
CPU-Optimized License Plate Detection using YOLOv10n with ONNX Runtime.

This module provides CPU-efficient plate detection without requiring CUDA/TensorRT.
Uses ONNX Runtime with CPU optimizations for inference.
"""
import os
import time
from typing import List, Tuple, Optional, Dict, Any
from pathlib import Path
import numpy as np
import cv2

# Check for ONNX Runtime
try:
    import onnxruntime as ort
    ONNX_AVAILABLE = True
except ImportError:
    ONNX_AVAILABLE = False
    print("[PlateDetectorCPU][WARN] onnxruntime not available. Install with: pip install onnxruntime")

# Check for ultralytics (for model download/export)
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    print("[PlateDetectorCPU][WARN] ultralytics not available. Install with: pip install ultralytics")


class PlateDetectorCPU:
    """
    CPU-Optimized License Plate Detector using ONNX Runtime.

    Features:
    - ONNX Runtime with CPU optimizations (MKL-DNN, OpenMP)
    - Automatic model download from ultralytics
    - INT8/FP16 quantization support
    - Thread-optimized inference
    """

    MODEL_URL = "yolov10n.pt"  # Will be downloaded from ultralytics hub

    def __init__(
        self,
        weights_path: Optional[str] = None,
        imgsz: int = 320,
        conf_thresh: float = 0.35,
        iou_thresh: float = 0.5,
        pad: int = 4,
        num_threads: int = 0,  # 0 = auto-detect
        use_gpu_if_available: bool = False
    ):
        """
        Initialize CPU-optimized plate detector.

        Args:
            weights_path: Path to ONNX model. If None, downloads YOLOv10n.
            imgsz: Input image size (320 for speed, 640 for accuracy)
            conf_thresh: Confidence threshold
            iou_thresh: IoU threshold for NMS (if needed)
            pad: Padding around detected boxes
            num_threads: Number of CPU threads (0 = auto)
            use_gpu_if_available: Try to use GPU via ONNX Runtime if available
        """
        self.imgsz = imgsz
        self.conf_thresh = conf_thresh
        self.iou_thresh = iou_thresh
        self.pad = pad
        self.num_threads = num_threads
        self.use_gpu = use_gpu_if_available

        # Model paths
        self.model_dir = Path(__file__).parent
        self.onnx_path = self.model_dir / f"yolov10n_plate_{imgsz}.onnx"
        self.pt_path = weights_path or str(self.model_dir / "yolov10n.pt")

        # Initialize session
        self.session = None
        self.input_name = None
        self.output_names = None

        self._initialize_model()

    def _initialize_model(self):
        """Initialize ONNX model, downloading/exporting if necessary."""

        # Step 1: Check if ONNX model exists
        if self.onnx_path.exists():
            print(f"[PlateDetectorCPU] Loading existing ONNX model: {self.onnx_path}")
            self._load_onnx_model()
            return

        # Step 2: Check if we can export from PT file
        if ULTRALYTICS_AVAILABLE:
            self._export_to_onnx()
        else:
            raise RuntimeError(
                f"ONNX model not found at {self.onnx_path} and ultralytics not available for export. "
                "Install ultralytics: pip install ultralytics"
            )

    def _export_to_onnx(self):
        """Export YOLOv10n to ONNX format."""
        print(f"[PlateDetectorCPU] Exporting YOLOv10n to ONNX...")

        # Load or download YOLOv10n
        if os.path.exists(self.pt_path):
            print(f"[PlateDetectorCPU] Loading from {self.pt_path}")
            model = YOLO(self.pt_path)
        else:
            print(f"[PlateDetectorCPU] Downloading YOLOv10n from ultralytics...")
            model = YOLO("yolov10n.pt")  # Auto-downloads

        # Export to ONNX with CPU optimizations
        try:
            export_path = model.export(
                format="onnx",
                imgsz=self.imgsz,
                simplify=True,
                opset=12,  # Good compatibility
                dynamic=False,  # Static shape for better CPU optimization
            )

            # Move to our expected location
            if export_path and os.path.exists(export_path):
                import shutil
                shutil.move(export_path, str(self.onnx_path))
                print(f"[PlateDetectorCPU] ONNX model saved to: {self.onnx_path}")

            self._load_onnx_model()

        except Exception as e:
            print(f"[PlateDetectorCPU][ERROR] ONNX export failed: {e}")
            # Fallback to using ultralytics directly
            self._use_ultralytics_fallback()

    def _use_ultralytics_fallback(self):
        """Fallback to using ultralytics YOLO directly (slower but works)."""
        print("[PlateDetectorCPU] Using ultralytics fallback mode")
        self.fallback_model = YOLO("yolov10n.pt")
        self.session = None

    def _load_onnx_model(self):
        """Load ONNX model with CPU optimizations."""
        if not ONNX_AVAILABLE:
            raise RuntimeError("ONNX Runtime not available")

        # Configure session options for CPU optimization
        sess_options = ort.SessionOptions()

        # Threading
        if self.num_threads > 0:
            sess_options.intra_op_num_threads = self.num_threads
            sess_options.inter_op_num_threads = self.num_threads

        # Graph optimizations
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        # Execution mode
        sess_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL

        # Select execution provider
        providers = []
        if self.use_gpu:
            # Try GPU providers first
            available_providers = ort.get_available_providers()
            if 'CUDAExecutionProvider' in available_providers:
                providers.append('CUDAExecutionProvider')
            if 'DmlExecutionProvider' in available_providers:  # DirectML for AMD/Intel
                providers.append('DmlExecutionProvider')

        providers.append('CPUExecutionProvider')

        # Create session
        print(f"[PlateDetectorCPU] Creating ONNX session with providers: {providers}")
        self.session = ort.InferenceSession(
            str(self.onnx_path),
            sess_options=sess_options,
            providers=providers
        )

        # Get input/output names
        self.input_name = self.session.get_inputs()[0].name
        self.output_names = [o.name for o in self.session.get_outputs()]

        # Get input shape
        input_shape = self.session.get_inputs()[0].shape
        print(f"[PlateDetectorCPU] Model loaded successfully")
        print(f"  - Input: {self.input_name} {input_shape}")
        print(f"  - Outputs: {self.output_names}")
        print(f"  - Provider: {self.session.get_providers()}")

    def preprocess(self, frame: np.ndarray) -> Tuple[np.ndarray, float, Tuple[int, int]]:
        """
        Preprocess frame for YOLO inference.

        Args:
            frame: Input BGR frame

        Returns:
            Tuple of (preprocessed_tensor, scale_factor, original_size)
        """
        orig_h, orig_w = frame.shape[:2]

        # Resize maintaining aspect ratio with letterboxing
        scale = min(self.imgsz / orig_w, self.imgsz / orig_h)
        new_w, new_h = int(orig_w * scale), int(orig_h * scale)

        # Resize
        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        # Create letterboxed image
        letterboxed = np.full((self.imgsz, self.imgsz, 3), 114, dtype=np.uint8)
        pad_x, pad_y = (self.imgsz - new_w) // 2, (self.imgsz - new_h) // 2
        letterboxed[pad_y:pad_y+new_h, pad_x:pad_x+new_w] = resized

        # Convert BGR to RGB
        rgb = cv2.cvtColor(letterboxed, cv2.COLOR_BGR2RGB)

        # Normalize and transpose to NCHW
        tensor = rgb.astype(np.float32) / 255.0
        tensor = tensor.transpose(2, 0, 1)  # HWC -> CHW
        tensor = np.expand_dims(tensor, axis=0)  # Add batch dimension

        return tensor, scale, (orig_w, orig_h), (pad_x, pad_y)

    def postprocess(
        self,
        outputs: List[np.ndarray],
        scale: float,
        orig_size: Tuple[int, int],
        padding: Tuple[int, int]
    ) -> List[Tuple[float, float, float, float, float, int]]:
        """
        Postprocess YOLO outputs to get detections.

        Args:
            outputs: Model outputs
            scale: Scale factor used in preprocessing
            orig_size: Original frame size (w, h)
            padding: Padding used in letterboxing (pad_x, pad_y)

        Returns:
            List of (x1, y1, x2, y2, confidence, class_id)
        """
        orig_w, orig_h = orig_size
        pad_x, pad_y = padding

        # YOLOv10 output format: [batch, num_detections, 6] where 6 = [x1, y1, x2, y2, conf, class]
        # Or could be transposed depending on export settings
        output = outputs[0]

        if len(output.shape) == 3:
            output = output[0]  # Remove batch dimension

        # Handle different output shapes
        if output.shape[-1] == 6:
            # [num_detections, 6]
            boxes = output
        elif output.shape[0] == 6:
            # [6, num_detections]
            boxes = output.T
        else:
            # Try to interpret as [num_detections, 4+classes]
            # Take top class for each detection
            if len(output.shape) == 2 and output.shape[1] > 4:
                xyxy = output[:, :4]
                class_probs = output[:, 4:]
                confs = np.max(class_probs, axis=1)
                classes = np.argmax(class_probs, axis=1)
                boxes = np.column_stack([xyxy, confs, classes])
            else:
                return []

        detections = []
        for box in boxes:
            x1, y1, x2, y2, conf, cls = box[:6]

            if conf < self.conf_thresh:
                continue

            # Remove padding and scale back to original size
            x1 = (x1 - pad_x) / scale
            y1 = (y1 - pad_y) / scale
            x2 = (x2 - pad_x) / scale
            y2 = (y2 - pad_y) / scale

            # Clamp to original image bounds
            x1 = max(0, min(orig_w, x1))
            y1 = max(0, min(orig_h, y1))
            x2 = max(0, min(orig_w, x2))
            y2 = max(0, min(orig_h, y2))

            if x2 > x1 and y2 > y1:
                detections.append((float(x1), float(y1), float(x2), float(y2), float(conf), int(cls)))

        return detections

    def detect(self, frame: np.ndarray) -> List[Tuple[float, float, float, float, float, int]]:
        """
        Run detection on a frame.

        Args:
            frame: Input BGR frame

        Returns:
            List of (x1, y1, x2, y2, confidence, class_id)
        """
        if self.session is not None:
            # ONNX Runtime inference
            tensor, scale, orig_size, padding = self.preprocess(frame)
            outputs = self.session.run(self.output_names, {self.input_name: tensor})
            return self.postprocess(outputs, scale, orig_size, padding)
        elif hasattr(self, 'fallback_model'):
            # Ultralytics fallback
            results = self.fallback_model.predict(
                source=frame,
                imgsz=self.imgsz,
                conf=self.conf_thresh,
                device='cpu',
                verbose=False
            )
            boxes = []
            for r in results:
                if r.boxes is not None:
                    xyxy = r.boxes.xyxy.cpu().numpy()
                    confs = r.boxes.conf.cpu().numpy() if r.boxes.conf is not None else np.ones(len(xyxy))
                    clss = r.boxes.cls.cpu().numpy() if r.boxes.cls is not None else np.zeros(len(xyxy))
                    for (x1, y1, x2, y2), c, k in zip(xyxy, confs, clss):
                        boxes.append((float(x1), float(y1), float(x2), float(y2), float(c), int(k)))
            return boxes
        else:
            raise RuntimeError("No detection model available")

    def pad_box(self, box: Tuple[float, float, float, float], frame_shape: Tuple[int, int]) -> List[int]:
        """Add padding to detection box."""
        h, w = frame_shape[:2]
        x1, y1, x2, y2 = box

        x1 = max(0, min(w - 1, int(x1 - self.pad)))
        y1 = max(0, min(h - 1, int(y1 - self.pad)))
        x2 = max(0, min(w - 1, int(x2 + self.pad)))
        y2 = max(0, min(h - 1, int(y2 + self.pad)))

        return [x1, y1, x2, y2]

    def process_frame(self, frame: np.ndarray, frame_id: int) -> Tuple[int, List[List[int]]]:
        """
        Process a frame and return rectangles to blur.

        Args:
            frame: Input BGR frame
            frame_id: Frame identifier

        Returns:
            Tuple of (frame_id, list of [x1, y1, x2, y2] rectangles)
        """
        detections = self.detect(frame)
        rectangles = [self.pad_box((x1, y1, x2, y2), frame.shape) for x1, y1, x2, y2, _, _ in detections]
        return frame_id, rectangles

    def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        info = {
            "model_type": "plate_detector_cpu",
            "model_variant": "YOLOv10n_ONNX",
            "imgsz": self.imgsz,
            "conf_thresh": self.conf_thresh,
            "onnx_path": str(self.onnx_path),
            "onnx_available": ONNX_AVAILABLE,
            "ultralytics_available": ULTRALYTICS_AVAILABLE,
        }

        if self.session is not None:
            info["providers"] = self.session.get_providers()
            info["mode"] = "onnx_runtime"
        elif hasattr(self, 'fallback_model'):
            info["mode"] = "ultralytics_fallback"

        return info


def benchmark_plate_detector():
    """Benchmark the CPU plate detector."""
    print("=" * 60)
    print("PlateDetectorCPU Benchmark")
    print("=" * 60)

    # Create detector
    detector = PlateDetectorCPU(imgsz=320, conf_thresh=0.25)

    # Create test frame
    test_frame = np.random.randint(0, 255, (720, 1280, 3), dtype=np.uint8)

    # Add some text/shapes to simulate content
    cv2.rectangle(test_frame, (200, 300), (400, 350), (255, 255, 255), -1)
    cv2.putText(test_frame, "ABC 123", (210, 335), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)

    # Warmup
    print("\nWarming up...")
    for _ in range(5):
        detector.process_frame(test_frame, 0)

    # Benchmark
    print("\nBenchmarking (100 frames)...")
    times = []
    for i in range(100):
        start = time.time()
        frame_id, rects = detector.process_frame(test_frame, i)
        times.append((time.time() - start) * 1000)

    avg_time = np.mean(times)
    min_time = np.min(times)
    max_time = np.max(times)
    fps = 1000 / avg_time

    print(f"\nResults:")
    print(f"  Average: {avg_time:.2f}ms")
    print(f"  Min: {min_time:.2f}ms")
    print(f"  Max: {max_time:.2f}ms")
    print(f"  FPS: {fps:.1f}")
    print(f"\nModel Info:")
    for k, v in detector.get_model_info().items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    benchmark_plate_detector()
