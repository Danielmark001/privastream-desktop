"""
Room service - manages room state, whitelists, and privacy zones.
Replaces global room_embeddings and room_privacy_zones dictionaries.
"""
from typing import Optional, Dict, Any, List
import numpy as np
from datetime import datetime
from collections import deque
import threading

from core.logging import get_logger
from core.errors import AppError, ErrorCode, ValidationError
from core.models import PrivacyZone

logger = get_logger(__name__)


class RoomData:
    """Data structure for room-specific state."""

    def __init__(self, room_id: str):
        self.room_id = room_id
        self.created_at = datetime.now()

        # Face whitelist
        self.whitelist_embedding: Optional[np.ndarray] = None
        self.whitelist_metadata: Dict[str, Any] = {}

        # Privacy zones
        self.privacy_zones: List[PrivacyZone] = []

        # Motion tracking state
        self.prev_gray: Optional[np.ndarray] = None
        self.motion_history: deque = deque(maxlen=5)
        self.current_stride: int = 1
        self.frames_since_detection: int = 0


class RoomService:
    """
    Service for managing room-specific state.

    Handles whitelists, privacy zones, and motion tracking per room.
    Thread-safe with internal locking.
    """

    def __init__(self):
        """Initialize room service."""
        self._rooms: Dict[str, RoomData] = {}
        self._lock = threading.Lock()

    def get_or_create_room(self, room_id: str) -> RoomData:
        """
        Get existing room or create new one.

        Args:
            room_id: Room identifier

        Returns:
            RoomData instance
        """
        with self._lock:
            if room_id not in self._rooms:
                logger.info(f"Creating new room: {room_id}")
                self._rooms[room_id] = RoomData(room_id)
            return self._rooms[room_id]

    def get_room(self, room_id: str) -> Optional[RoomData]:
        """
        Get room by ID.

        Args:
            room_id: Room identifier

        Returns:
            RoomData or None if not found
        """
        with self._lock:
            return self._rooms.get(room_id)

    def room_exists(self, room_id: str) -> bool:
        """Check if room exists."""
        with self._lock:
            return room_id in self._rooms

    def delete_room(self, room_id: str) -> bool:
        """
        Delete room and all associated data.

        Args:
            room_id: Room identifier

        Returns:
            True if room was deleted, False if not found
        """
        with self._lock:
            if room_id in self._rooms:
                logger.info(f"Deleting room: {room_id}")
                del self._rooms[room_id]
                return True
            return False

    def set_whitelist(
        self,
        room_id: str,
        embedding: np.ndarray,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Set face whitelist for room.

        Args:
            room_id: Room identifier
            embedding: Face embedding vector
            metadata: Optional metadata (name, etc.)
        """
        room = self.get_or_create_room(room_id)
        with self._lock:
            room.whitelist_embedding = embedding
            room.whitelist_metadata = metadata or {}
            logger.info(
                f"Whitelist updated for room {room_id}",
                extra={"room_id": room_id, "has_metadata": bool(metadata)}
            )

    def get_whitelist(self, room_id: str) -> Optional[np.ndarray]:
        """
        Get whitelist embedding for room.

        Args:
            room_id: Room identifier

        Returns:
            Embedding or None if not set
        """
        room = self.get_room(room_id)
        if room:
            return room.whitelist_embedding
        return None

    def has_whitelist(self, room_id: str) -> bool:
        """Check if room has whitelist set."""
        room = self.get_room(room_id)
        return room is not None and room.whitelist_embedding is not None

    def transfer_whitelist(self, source_room_id: str, target_room_id: str) -> None:
        """
        Transfer whitelist from one room to another.

        Args:
            source_room_id: Source room ID
            target_room_id: Target room ID

        Raises:
            ValidationError: If source room doesn't have whitelist
        """
        source_room = self.get_room(source_room_id)
        if not source_room or source_room.whitelist_embedding is None:
            raise ValidationError(
                f"Source room {source_room_id} has no whitelist to transfer",
                field="source_room_id"
            )

        target_room = self.get_or_create_room(target_room_id)
        with self._lock:
            target_room.whitelist_embedding = source_room.whitelist_embedding.copy()
            target_room.whitelist_metadata = source_room.whitelist_metadata.copy()

        logger.info(f"Whitelist transferred from {source_room_id} to {target_room_id}")

    def add_privacy_zone(self, room_id: str, zone: PrivacyZone) -> None:
        """
        Add privacy zone to room.

        Args:
            room_id: Room identifier
            zone: Privacy zone definition
        """
        room = self.get_or_create_room(room_id)
        with self._lock:
            # Remove existing zone with same ID
            room.privacy_zones = [z for z in room.privacy_zones if z.id != zone.id]
            # Add new zone
            room.privacy_zones.append(zone)

        logger.info(
            f"Privacy zone added to room {room_id}",
            extra={"room_id": room_id, "zone_id": zone.id}
        )

    def remove_privacy_zone(self, room_id: str, zone_id: str) -> bool:
        """
        Remove privacy zone from room.

        Args:
            room_id: Room identifier
            zone_id: Zone identifier

        Returns:
            True if zone was removed, False if not found
        """
        room = self.get_room(room_id)
        if not room:
            return False

        with self._lock:
            original_count = len(room.privacy_zones)
            room.privacy_zones = [z for z in room.privacy_zones if z.id != zone_id]
            removed = len(room.privacy_zones) < original_count

        if removed:
            logger.info(
                f"Privacy zone removed from room {room_id}",
                extra={"room_id": room_id, "zone_id": zone_id}
            )

        return removed

    def get_privacy_zones(self, room_id: str) -> List[PrivacyZone]:
        """
        Get all privacy zones for room.

        Args:
            room_id: Room identifier

        Returns:
            List of privacy zones
        """
        room = self.get_room(room_id)
        if room:
            return room.privacy_zones.copy()
        return []

    def get_room_status(self, room_id: str) -> Dict[str, Any]:
        """
        Get comprehensive room status.

        Args:
            room_id: Room identifier

        Returns:
            Dictionary with room status
        """
        room = self.get_room(room_id)
        if not room:
            raise AppError(
                code=ErrorCode.ROOM_NOT_FOUND,
                message=f"Room {room_id} not found"
            )

        return {
            "room_id": room_id,
            "has_whitelist": room.whitelist_embedding is not None,
            "whitelist_metadata": room.whitelist_metadata,
            "privacy_zones_count": len(room.privacy_zones),
            "privacy_zones": [z.dict() for z in room.privacy_zones],
            "motion_tracking_enabled": room.prev_gray is not None,
            "current_stride": room.current_stride,
            "created_at": room.created_at.isoformat(),
        }

    def list_rooms(self) -> List[str]:
        """Get list of all room IDs."""
        with self._lock:
            return list(self._rooms.keys())

    def get_room_count(self) -> int:
        """Get total number of rooms."""
        with self._lock:
            return len(self._rooms)
