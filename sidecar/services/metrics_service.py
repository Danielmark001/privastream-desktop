"""
Metrics service - tracks performance metrics and statistics.
Replaces global performance_metrics dictionary.
"""
from typing import Dict, Any, Optional
from collections import deque
import time
import threading

from core.logging import get_logger

logger = get_logger(__name__)


class MetricsService:
    """
    Service for tracking application performance metrics.

    Thread-safe collection of processing times, FPS, and other statistics.
    """

    def __init__(self):
        """Initialize metrics service."""
        self._lock = threading.Lock()
        self._start_time = time.time()

        # Frame processing metrics
        self._frame_times = deque(maxlen=30)
        self._detection_times = {
            'face': deque(maxlen=10),
            'pii': deque(maxlen=10),
            'plate': deque(maxlen=10),
        }

        # Counters
        self._frames_processed = 0
        self._frames_dropped = 0

        # Adaptive stride stats
        self._adaptive_stride_stats = deque(maxlen=10)

        # Request queue metrics
        self._active_requests = 0
        self._max_concurrent_requests = 0

    def record_frame_time(self, duration_ms: float) -> None:
        """
        Record frame processing time.

        Args:
            duration_ms: Processing time in milliseconds
        """
        with self._lock:
            self._frame_times.append(duration_ms)
            self._frames_processed += 1

    def record_detection_time(self, detector_type: str, duration_ms: float) -> None:
        """
        Record detection time for specific detector.

        Args:
            detector_type: Type of detector (face, pii, plate)
            duration_ms: Detection time in milliseconds
        """
        with self._lock:
            if detector_type in self._detection_times:
                self._detection_times[detector_type].append(duration_ms)

    def record_frame_dropped(self, reason: str = "unknown") -> None:
        """
        Record dropped frame.

        Args:
            reason: Reason for dropping
        """
        with self._lock:
            self._frames_dropped += 1
        logger.debug(f"Frame dropped: {reason}")

    def record_adaptive_stride(self, stride: int, motion_level: float) -> None:
        """
        Record adaptive stride decision.

        Args:
            stride: Current stride value
            motion_level: Detected motion level
        """
        with self._lock:
            self._adaptive_stride_stats.append({
                'stride': stride,
                'motion_level': motion_level,
                'timestamp': time.time(),
            })

    def increment_active_requests(self) -> None:
        """Increment active request counter."""
        with self._lock:
            self._active_requests += 1
            if self._active_requests > self._max_concurrent_requests:
                self._max_concurrent_requests = self._active_requests

    def decrement_active_requests(self) -> None:
        """Decrement active request counter."""
        with self._lock:
            if self._active_requests > 0:
                self._active_requests -= 1

    def get_active_requests(self) -> int:
        """Get current active request count."""
        with self._lock:
            return self._active_requests

    def get_metrics(self) -> Dict[str, Any]:
        """
        Get comprehensive metrics.

        Returns:
            Dictionary with all metrics
        """
        with self._lock:
            uptime = time.time() - self._start_time

            # Calculate averages
            avg_frame_time = (
                sum(self._frame_times) / len(self._frame_times)
                if self._frame_times else 0.0
            )

            avg_detection_times = {}
            for detector_type, times in self._detection_times.items():
                avg_detection_times[detector_type] = (
                    sum(times) / len(times) if times else 0.0
                )

            # Calculate FPS
            current_fps = 1000.0 / avg_frame_time if avg_frame_time > 0 else 0.0

            # Adaptive stride stats
            adaptive_stats = None
            if self._adaptive_stride_stats:
                recent_strides = [s['stride'] for s in self._adaptive_stride_stats]
                recent_motions = [s['motion_level'] for s in self._adaptive_stride_stats]
                adaptive_stats = {
                    'avg_stride': sum(recent_strides) / len(recent_strides),
                    'avg_motion': sum(recent_motions) / len(recent_motions),
                    'recent_strides': list(recent_strides),
                }

            return {
                "uptime_seconds": uptime,
                "frames_processed": self._frames_processed,
                "frames_dropped": self._frames_dropped,
                "avg_frame_time_ms": avg_frame_time,
                "avg_detection_times_ms": avg_detection_times,
                "current_fps": current_fps,
                "adaptive_stride_stats": adaptive_stats,
                "active_requests": self._active_requests,
                "max_concurrent_requests": self._max_concurrent_requests,
            }

    def reset(self) -> None:
        """Reset all metrics."""
        with self._lock:
            self._start_time = time.time()
            self._frame_times.clear()
            for times in self._detection_times.values():
                times.clear()
            self._adaptive_stride_stats.clear()
            self._frames_processed = 0
            self._frames_dropped = 0
            self._active_requests = 0
            self._max_concurrent_requests = 0
        logger.info("Metrics reset")
