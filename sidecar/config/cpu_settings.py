"""
CPU-Only Settings for PrivaStream

This module provides configuration for running all detection models on CPU,
optimized for systems without NVIDIA GPU or when GPU is not available.

Key optimizations:
- ONNX Runtime with CPU providers
- Thread optimization for multi-core CPUs
- Smaller input resolutions where possible
- Lightweight model variants
"""
import os
import multiprocessing
from typing import Dict, Any, Optional
from dataclasses import dataclass, field


def get_optimal_threads() -> int:
    """Get optimal thread count for CPU inference."""
    cpu_count = multiprocessing.cpu_count()
    # Use 75% of available cores for inference, leave some for OS/other tasks
    return max(1, int(cpu_count * 0.75))


@dataclass
class CPUFaceSettings:
    """CPU-optimized face detection settings."""
    # Use YuNet (lightweight, built into OpenCV)
    use_yunet: bool = True
    # YuNet settings
    input_size: tuple = (320, 320)
    conf_threshold: float = 0.6
    nms_threshold: float = 0.3
    # InsightFace fallback (slower but has embeddings)
    use_insightface_fallback: bool = True
    insightface_model: str = "buffalo_s"
    # Box dilation
    dilate_px: int = 12


@dataclass
class CPUPlateSettings:
    """CPU-optimized plate detection settings."""
    # Use ONNX instead of TensorRT
    use_onnx: bool = True
    # Model settings
    imgsz: int = 320  # Smaller for speed
    conf_thresh: float = 0.35
    iou_thresh: float = 0.5
    pad: int = 4
    # Thread settings
    num_threads: int = 0  # 0 = auto


@dataclass
class CPUPIISettings:
    """CPU-optimized PII/text detection settings."""
    # Force CPU mode for PaddleOCR
    use_gpu: bool = False
    # Use angle classifier (slower but more accurate)
    use_angle_cls: bool = False
    # Detection limit (smaller = faster)
    det_limit_side_len: int = 640
    # Language
    lang: str = 'en'
    # Classifier threshold
    conf_thresh: float = 0.35
    # Min text area
    min_area: int = 80
    # Temporal smoothing
    K_confirm: int = 2
    K_hold: int = 8


@dataclass
class CPUAudioSettings:
    """CPU-optimized audio processing settings."""
    # Use Faster-Whisper with INT8
    whisper_model: str = "base"  # tiny, base, small
    whisper_compute_type: str = "int8"  # int8 for CPU
    # VAD settings
    vad_mode: str = "silero"  # silero or webrtc
    vad_threshold: float = 0.5
    # NER model
    ner_model: str = "dslim/bert-base-NER"


@dataclass
class CPUPerformanceSettings:
    """CPU performance tuning settings."""
    # Thread pool
    num_threads: int = field(default_factory=get_optimal_threads)
    # Detection interval (skip frames)
    detection_fps: float = 4.0  # Run detection at 4 FPS
    # Frame caching
    enable_cache: bool = True
    cache_size: int = 100
    # Request queue
    max_concurrent_requests: int = 4
    # Resolution scaling
    max_detection_resolution: int = 720  # Downscale to 720p for detection


@dataclass
class CPUSettings:
    """Complete CPU settings bundle."""
    face: CPUFaceSettings = field(default_factory=CPUFaceSettings)
    plate: CPUPlateSettings = field(default_factory=CPUPlateSettings)
    pii: CPUPIISettings = field(default_factory=CPUPIISettings)
    audio: CPUAudioSettings = field(default_factory=CPUAudioSettings)
    performance: CPUPerformanceSettings = field(default_factory=CPUPerformanceSettings)

    # Global settings
    force_cpu: bool = True
    debug: bool = False
    log_performance: bool = True


# Pre-configured profiles
CPU_PROFILES = {
    "fast": CPUSettings(
        face=CPUFaceSettings(
            use_yunet=True,
            input_size=(224, 224),
            conf_threshold=0.7
        ),
        plate=CPUPlateSettings(imgsz=256, conf_thresh=0.4),
        pii=CPUPIISettings(det_limit_side_len=480),
        performance=CPUPerformanceSettings(detection_fps=2.0)
    ),
    "balanced": CPUSettings(
        face=CPUFaceSettings(
            use_yunet=True,
            input_size=(320, 320),
            conf_threshold=0.6
        ),
        plate=CPUPlateSettings(imgsz=320, conf_thresh=0.35),
        pii=CPUPIISettings(det_limit_side_len=640),
        performance=CPUPerformanceSettings(detection_fps=4.0)
    ),
    "accurate": CPUSettings(
        face=CPUFaceSettings(
            use_yunet=True,
            input_size=(480, 480),
            conf_threshold=0.5
        ),
        plate=CPUPlateSettings(imgsz=480, conf_thresh=0.3),
        pii=CPUPIISettings(det_limit_side_len=960),
        performance=CPUPerformanceSettings(detection_fps=6.0)
    ),
}


def get_cpu_settings(profile: str = "balanced") -> CPUSettings:
    """
    Get CPU settings for a specific profile.

    Args:
        profile: One of 'fast', 'balanced', 'accurate'

    Returns:
        CPUSettings instance
    """
    if profile not in CPU_PROFILES:
        print(f"[CPUSettings] Unknown profile '{profile}', using 'balanced'")
        profile = "balanced"

    return CPU_PROFILES[profile]


def to_unified_config(settings: CPUSettings) -> Dict[str, Any]:
    """
    Convert CPUSettings to UnifiedBlurDetector config format.

    Args:
        settings: CPUSettings instance

    Returns:
        Config dict for UnifiedBlurDetector
    """
    return {
        "enable_face": True,
        "enable_pii": True,
        "enable_plate": True,
        "force_cpu": settings.force_cpu,
        "face": {
            "use_yunet": settings.face.use_yunet,
            "input_size": settings.face.input_size,
            "conf_threshold": settings.face.conf_threshold,
            "dilate_px": settings.face.dilate_px,
        },
        "pii": {
            "use_gpu": settings.pii.use_gpu,
            "conf_thresh": settings.pii.conf_thresh,
            "det_limit_side_len": settings.pii.det_limit_side_len,
            "min_area": settings.pii.min_area,
        },
        "plate": {
            "use_onnx": settings.plate.use_onnx,
            "imgsz": settings.plate.imgsz,
            "conf_thresh": settings.plate.conf_thresh,
            "num_threads": settings.plate.num_threads,
        },
        "performance": {
            "detection_fps": settings.performance.detection_fps,
            "num_threads": settings.performance.num_threads,
            "enable_cache": settings.performance.enable_cache,
        }
    }


def print_settings(settings: CPUSettings):
    """Print settings summary."""
    print("=" * 60)
    print("CPU Settings Summary")
    print("=" * 60)

    print(f"\nGlobal:")
    print(f"  Force CPU: {settings.force_cpu}")
    print(f"  Threads: {settings.performance.num_threads}")

    print(f"\nFace Detection:")
    print(f"  Use YuNet: {settings.face.use_yunet}")
    print(f"  Input Size: {settings.face.input_size}")
    print(f"  Confidence: {settings.face.conf_threshold}")

    print(f"\nPlate Detection:")
    print(f"  Use ONNX: {settings.plate.use_onnx}")
    print(f"  Input Size: {settings.plate.imgsz}")
    print(f"  Confidence: {settings.plate.conf_thresh}")

    print(f"\nPII Detection:")
    print(f"  Use GPU: {settings.pii.use_gpu}")
    print(f"  Det Limit: {settings.pii.det_limit_side_len}")

    print(f"\nPerformance:")
    print(f"  Detection FPS: {settings.performance.detection_fps}")
    print(f"  Max Resolution: {settings.performance.max_detection_resolution}p")
    print(f"  Cache: {settings.performance.enable_cache}")

    print("=" * 60)


if __name__ == "__main__":
    # Demo
    print("Available CPU profiles: fast, balanced, accurate\n")

    for profile_name in ["fast", "balanced", "accurate"]:
        print(f"\n{'='*60}")
        print(f"Profile: {profile_name.upper()}")
        settings = get_cpu_settings(profile_name)
        print_settings(settings)
