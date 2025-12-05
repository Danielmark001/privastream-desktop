"""
Centralized configuration management using Pydantic Settings.
All hardcoded values from video_filter_api.py consolidated here.
"""
from pydantic import BaseModel, Field, validator
from pydantic_settings import BaseSettings
from typing import Dict, Optional
from pathlib import Path
from functools import lru_cache
import os


class AdaptiveStrideConfig(BaseModel):
    """Configuration for motion-based adaptive frame skipping."""
    min_stride: int = Field(1, ge=1, description="Process every frame during high motion")
    max_stride: int = Field(4, ge=1, description="Skip up to 3 frames during static scenes")
    motion_threshold_low: float = Field(0.5, ge=0, description="Low motion threshold")
    motion_threshold_high: float = Field(3.0, ge=0, description="High motion threshold")
    history_size: int = Field(5, ge=1, description="Number of frames to average for motion")


class PIIDetectorConfig(BaseModel):
    """PII text detection configuration."""
    classifier_path: str = "video_models/pii_blur/pii_clf.joblib"
    conf_thresh: float = Field(0.35, ge=0, le=1, description="Confidence threshold")


class BlurStrengthConfig(BaseModel):
    """Blur strength for different detection types."""
    face: int = Field(75, ge=0, le=255, description="Blur strength for faces")
    pii: int = Field(75, ge=0, le=255, description="Blur strength for text PII")
    plate: int = Field(100, ge=0, le=255, description="Blur strength for license plates")
    default: int = Field(75, ge=0, le=255, description="Default blur strength")


class DetectorConfig(BaseModel):
    """Main detector configuration."""
    enable_face: bool = True
    enable_pii: bool = True
    enable_plate: bool = True
    pii: PIIDetectorConfig = PIIDetectorConfig()
    blur_strength: BlurStrengthConfig = BlurStrengthConfig()


class DebugConfig(BaseModel):
    """Debug output configuration."""
    enabled: bool = False
    output_dir: str = "debug_images"
    save_input: bool = True
    save_output: bool = True
    max_images: int = Field(100, ge=1, description="Limit to prevent disk space issues")


class QueueConfig(BaseModel):
    """Request queue protection configuration."""
    max_request_age_ms: int = Field(1000, ge=0, description="Drop requests older than this")
    max_concurrent_requests: int = Field(10, ge=1, description="Limit concurrent processing")
    enable_request_dropping: bool = True
    queue_monitoring: bool = True


class PerformanceConfig(BaseModel):
    """Performance tuning configuration."""
    detection_fps_base: float = Field(15.0, ge=1, le=60, description="Base FPS for detection")
    enable_adaptive_stride: bool = True
    adaptive_stride: AdaptiveStrideConfig = AdaptiveStrideConfig()
    enable_async_encoding: bool = True
    enable_frame_caching: bool = True
    cache_size: int = Field(10, ge=0, description="Number of recent frames to cache")
    encoding_workers: int = Field(4, ge=1, le=16, description="Thread pool size for encoding")


class CORSConfig(BaseModel):
    """CORS configuration."""
    origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "https://www.privastream.site",
        "https://privastream.site"
    ]
    methods: list[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers: list[str] = ["Content-Type", "Authorization"]
    supports_credentials: bool = True


class ServerConfig(BaseModel):
    """Server configuration."""
    host: str = "0.0.0.0"
    port: int = int(os.environ.get("PORT", 5001))
    debug: bool = False
    threaded: bool = True


class Settings(BaseSettings):
    """Main application settings.

    Can be overridden via environment variables with PRIVASTREAM_ prefix.
    Example: PRIVASTREAM_SERVER__PORT=8080
    """

    # Core settings
    app_name: str = "PrivaStream Video Filter API"
    version: str = "2.0.0"
    log_level: str = Field("INFO", description="Logging level: DEBUG, INFO, WARNING, ERROR")

    # Component configs
    detector: DetectorConfig = DetectorConfig()
    performance: PerformanceConfig = PerformanceConfig()
    debug: DebugConfig = DebugConfig()
    queue: QueueConfig = QueueConfig()
    cors: CORSConfig = CORSConfig()
    server: ServerConfig = ServerConfig()

    # Paths
    base_dir: Path = Field(default_factory=lambda: Path(__file__).parent.parent)
    models_dir: Path = Field(default_factory=lambda: Path(__file__).parent.parent / "video_models")

    @validator("models_dir", "base_dir")
    def validate_path_exists(cls, v):
        """Ensure critical paths exist."""
        if not v.exists():
            v.mkdir(parents=True, exist_ok=True)
        return v

    class Config:
        env_prefix = "PRIVASTREAM_"
        env_nested_delimiter = "__"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance (singleton pattern)."""
    return Settings()
