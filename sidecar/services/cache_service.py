"""
Cache service - manages frame caching for performance optimization.
Replaces global frame_cache dictionary with thread-safe service.
"""
from typing import Optional, Tuple, List, Dict, Any
import hashlib
import threading
import time
import cv2
import numpy as np

from core.logging import get_logger
from config.settings import Settings

logger = get_logger(__name__)


class CachedFrame:
    """Cached frame data."""

    def __init__(self, rectangles: List[Dict[str, Any]], encoded_frame: str):
        self.rectangles = rectangles
        self.encoded_frame = encoded_frame
        self.timestamp = time.time()
        self.hit_count = 0


class CacheService:
    """
    Service for caching processed frames.

    Provides fast frame hash computation and cache management
    with automatic cleanup and statistics tracking.
    """

    def __init__(self, settings: Settings):
        """
        Initialize cache service.

        Args:
            settings: Application settings
        """
        self.settings = settings
        self.enabled = settings.performance.enable_frame_caching
        self.max_size = settings.performance.cache_size

        self._cache: Dict[str, CachedFrame] = {}
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    def compute_hash(self, frame: np.ndarray, room_id: Optional[str] = None) -> str:
        """
        Compute fast hash of frame for caching.

        Args:
            frame: Input frame
            room_id: Optional room ID to include in hash

        Returns:
            MD5 hash string
        """
        # Downsample to 64x64 for fast hashing
        small = cv2.resize(frame, (64, 64))
        hash_input = small.tobytes() + (room_id or "").encode()
        return hashlib.md5(hash_input).hexdigest()

    def get(
        self,
        frame_hash: str
    ) -> Optional[Tuple[List[Dict[str, Any]], str]]:
        """
        Get cached frame by hash.

        Args:
            frame_hash: Frame hash

        Returns:
            Tuple of (rectangles, encoded_frame) or None if not cached
        """
        if not self.enabled:
            return None

        with self._lock:
            cached = self._cache.get(frame_hash)
            if cached:
                cached.hit_count += 1
                self._hits += 1
                logger.debug(f"Cache HIT for hash {frame_hash[:8]}")
                return cached.rectangles, cached.encoded_frame
            else:
                self._misses += 1
                logger.debug(f"Cache MISS for hash {frame_hash[:8]}")
                return None

    def put(
        self,
        frame_hash: str,
        rectangles: List[Dict[str, Any]],
        encoded_frame: str
    ) -> None:
        """
        Store frame in cache.

        Args:
            frame_hash: Frame hash
            rectangles: Detection rectangles
            encoded_frame: Base64-encoded frame
        """
        if not self.enabled:
            return

        with self._lock:
            self._cache[frame_hash] = CachedFrame(rectangles, encoded_frame)
            self._cleanup_if_needed()

    def _cleanup_if_needed(self) -> None:
        """Remove oldest entries if cache exceeds max size."""
        if len(self._cache) > self.max_size:
            # Sort by timestamp and keep most recent
            sorted_items = sorted(
                self._cache.items(),
                key=lambda x: x[1].timestamp
            )
            # Remove oldest entries
            to_remove = len(self._cache) - self.max_size
            for key, _ in sorted_items[:to_remove]:
                del self._cache[key]

            logger.debug(f"Cache cleanup: removed {to_remove} entries")

    def clear(self) -> None:
        """Clear all cached frames."""
        with self._lock:
            self._cache.clear()
            logger.info("Cache cleared")

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Dictionary with cache stats
        """
        with self._lock:
            total_requests = self._hits + self._misses
            hit_rate = self._hits / total_requests if total_requests > 0 else 0.0

            return {
                "enabled": self.enabled,
                "size": len(self._cache),
                "max_size": self.max_size,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": hit_rate,
                "total_requests": total_requests,
            }
