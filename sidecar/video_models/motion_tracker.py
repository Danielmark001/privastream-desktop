"""
Lightweight motion tracker for fast-moving objects using optical flow and Kalman filtering.
Tracks detected regions between heavy detection frames for smooth, lag-free blur.
"""
import numpy as np
import cv2
from typing import List, Tuple, Dict, Optional, Any
from dataclasses import dataclass
from collections import deque


@dataclass
class TrackedObject:
    """Represents a tracked object with motion prediction."""
    id: int
    box: List[float]  # [x1, y1, x2, y2]
    velocity: Tuple[float, float]  # (vx, vy) pixels per frame
    prev_velocity: Tuple[float, float]  # Previous velocity for acceleration calculation
    keypoints: Optional[np.ndarray]  # Sparse keypoints for optical flow
    kalman: Optional[Any]  # Kalman filter for smoothing
    age: int  # Frames since last detection update
    max_age: int = 15  # Max frames to track without detection

    def is_alive(self) -> bool:
        """Check if track is still valid."""
        return self.age < self.max_age

    def get_acceleration(self) -> Tuple[float, float]:
        """Calculate acceleration from current and previous velocity."""
        ax = self.velocity[0] - self.prev_velocity[0]
        ay = self.velocity[1] - self.prev_velocity[1]
        return (ax, ay)


class MotionTracker:
    """
    Fast motion tracker using optical flow and Kalman filtering.

    Architecture:
    1. Optical Flow: Track sparse keypoints between frames (Lucas-Kanade)
    2. Kalman Filter: Smooth trajectories and predict next position
    3. Velocity Expansion: Expand blur regions based on motion speed
    4. Adaptive Tracking: Adjust parameters based on motion magnitude
    """

    def __init__(self,
                 max_corners: int = 30,
                 quality_level: float = 0.01,
                 min_distance: int = 7,
                 velocity_expansion_factor: float = 1.5,
                 max_velocity_expansion: int = 50):
        """
        Initialize motion tracker.

        Args:
            max_corners: Maximum keypoints to track per object
            quality_level: Quality threshold for corner detection
            min_distance: Minimum distance between keypoints
            velocity_expansion_factor: Multiplier for velocity-based expansion
            max_velocity_expansion: Maximum pixels to expand region
        """
        self.max_corners = max_corners
        self.quality_level = quality_level
        self.min_distance = min_distance
        self.velocity_expansion_factor = velocity_expansion_factor
        self.max_velocity_expansion = max_velocity_expansion

        # Lucas-Kanade optical flow parameters
        self.lk_params = dict(
            winSize=(21, 21),
            maxLevel=3,
            criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03)
        )

        # Good features to track parameters
        self.feature_params = dict(
            maxCorners=max_corners,
            qualityLevel=quality_level,
            minDistance=min_distance,
            blockSize=7
        )

        # Tracking state
        self.prev_gray = None
        self.tracks: Dict[int, TrackedObject] = {}
        self.next_id = 0

        print(f"[MotionTracker] Initialized with optical flow + Kalman filtering")

    def _create_kalman_filter(self) -> cv2.KalmanFilter:
        """
        Create Kalman filter for smooth position tracking.

        State: [x, y, vx, vy] (position and velocity)
        Measurement: [x, y] (only position observed)
        """
        kf = cv2.KalmanFilter(4, 2)  # 4 state vars, 2 measurement vars

        # Transition matrix (position updates with velocity)
        kf.transitionMatrix = np.array([
            [1, 0, 1, 0],  # x = x + vx
            [0, 1, 0, 1],  # y = y + vy
            [0, 0, 1, 0],  # vx = vx
            [0, 0, 0, 1]   # vy = vy
        ], dtype=np.float32)

        # Measurement matrix (we only measure position)
        kf.measurementMatrix = np.array([
            [1, 0, 0, 0],  # measure x
            [0, 1, 0, 0]   # measure y
        ], dtype=np.float32)

        # Process noise (how much we trust the model)
        kf.processNoiseCov = np.eye(4, dtype=np.float32) * 0.03

        # Measurement noise (how much we trust observations)
        kf.measurementNoiseCov = np.eye(2, dtype=np.float32) * 0.1

        # Error covariance
        kf.errorCovPost = np.eye(4, dtype=np.float32)

        return kf

    def _extract_keypoints(self, gray: np.ndarray, box: List[float]) -> Optional[np.ndarray]:
        """Extract sparse keypoints from region for tracking."""
        x1, y1, x2, y2 = map(int, box)

        # Expand region slightly for better feature detection
        h, w = gray.shape
        x1 = max(0, x1 - 5)
        y1 = max(0, y1 - 5)
        x2 = min(w, x2 + 5)
        y2 = min(h, y2 + 5)

        # Extract region
        roi = gray[y1:y2, x1:x2]

        if roi.size == 0:
            return None

        # Detect good features to track
        corners = cv2.goodFeaturesToTrack(roi, mask=None, **self.feature_params)

        if corners is None or len(corners) < 3:
            return None

        # Convert to image coordinates
        corners[:, 0, 0] += x1
        corners[:, 0, 1] += y1

        return corners

    def _track_keypoints(self, prev_gray: np.ndarray, curr_gray: np.ndarray,
                        prev_points: np.ndarray) -> Tuple[Optional[np.ndarray], np.ndarray]:
        """Track keypoints using Lucas-Kanade optical flow."""
        if prev_points is None or len(prev_points) == 0:
            return None, np.array([])

        # Calculate optical flow
        next_points, status, error = cv2.calcOpticalFlowPyrLK(
            prev_gray, curr_gray, prev_points, None, **self.lk_params
        )

        if next_points is None:
            return None, np.array([])

        # Filter good points
        good_new = next_points[status == 1]
        good_old = prev_points[status == 1]

        if len(good_new) < 3:
            return None, np.array([])

        return good_new, good_old

    def _update_box_from_keypoints(self, old_box: List[float],
                                   old_points: np.ndarray,
                                   new_points: np.ndarray) -> Tuple[List[float], Tuple[float, float]]:
        """
        Update bounding box position based on keypoint motion.
        Returns: (updated_box, velocity)
        """
        # Calculate median displacement (robust to outliers)
        displacements = new_points - old_points
        median_dx = np.median(displacements[:, 0])
        median_dy = np.median(displacements[:, 1])

        # Update box position
        x1, y1, x2, y2 = old_box
        new_box = [
            x1 + median_dx,
            y1 + median_dy,
            x2 + median_dx,
            y2 + median_dy
        ]

        return new_box, (median_dx, median_dy)

    def _expand_box_by_velocity(self, box: List[float], velocity: Tuple[float, float], acceleration: Tuple[float, float] = (0.0, 0.0)) -> List[float]:
        """Expand bounding box based on motion velocity and acceleration for better coverage."""
        vx, vy = velocity
        ax, ay = acceleration
        speed = np.sqrt(vx**2 + vy**2)
        accel_magnitude = np.sqrt(ax**2 + ay**2)

        if speed < 1.0 and accel_magnitude < 1.0:
            return box

        # Base expansion proportional to speed
        speed_expansion = min(speed * self.velocity_expansion_factor, self.max_velocity_expansion)

        # Additional expansion for acceleration (sudden direction changes)
        # Acceleration expansion helps cover sudden movements
        accel_expansion = min(accel_magnitude * 0.5, self.max_velocity_expansion * 0.3)

        total_expansion = speed_expansion + accel_expansion

        # Expand in direction of motion
        x1, y1, x2, y2 = box

        # Expand forward in motion direction (if moving)
        if speed > 1.0:
            if vx > 0:
                x2 += total_expansion * abs(vx) / speed
            else:
                x1 += total_expansion * vx / speed

            if vy > 0:
                y2 += total_expansion * abs(vy) / speed
            else:
                y1 += total_expansion * vy / speed

        # Also expand in acceleration direction (if accelerating)
        if accel_magnitude > 1.0:
            if ax > 0:
                x2 += accel_expansion * abs(ax) / accel_magnitude
            else:
                x1 += accel_expansion * ax / accel_magnitude

            if ay > 0:
                y2 += accel_expansion * abs(ay) / accel_magnitude
            else:
                y1 += accel_expansion * ay / accel_magnitude

        # Also add small uniform expansion for safety
        uniform_expand = min(10, total_expansion * 0.3)
        x1 -= uniform_expand
        y1 -= uniform_expand
        x2 += uniform_expand
        y2 += uniform_expand

        return [x1, y1, x2, y2]

    def _iou(self, box1: List[float], box2: List[float]) -> float:
        """Calculate Intersection over Union between two boxes."""
        x1_1, y1_1, x2_1, y2_1 = box1
        x1_2, y1_2, x2_2, y2_2 = box2

        # Intersection
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)

        if x2_i < x1_i or y2_i < y1_i:
            return 0.0

        intersection = (x2_i - x1_i) * (y2_i - y1_i)

        # Union
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection

        return intersection / union if union > 0 else 0.0

    def update(self, frame: np.ndarray, detections: List[List[float]]) -> List[Dict[str, Any]]:
        """
        Update tracker with new frame and detections.

        Args:
            frame: Current frame (BGR)
            detections: List of detected boxes [[x1, y1, x2, y2], ...]

        Returns:
            List of tracked boxes with velocity info:
            [{'box': [x1, y1, x2, y2], 'velocity': (vx, vy), 'expanded_box': [...], 'speed': float}, ...]
        """
        curr_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        h, w = curr_gray.shape

        # First frame or no previous frame
        if self.prev_gray is None:
            self.prev_gray = curr_gray
            self.tracks = {}
            self.next_id = 0

            # Initialize tracks from detections
            for det in detections:
                keypoints = self._extract_keypoints(curr_gray, det)
                kalman = self._create_kalman_filter()

                # Initialize Kalman filter state
                cx, cy = (det[0] + det[2]) / 2, (det[1] + det[3]) / 2
                kalman.statePost = np.array([[cx], [cy], [0], [0]], dtype=np.float32)

                self.tracks[self.next_id] = TrackedObject(
                    id=self.next_id,
                    box=det,
                    velocity=(0.0, 0.0),
                    prev_velocity=(0.0, 0.0),
                    keypoints=keypoints,
                    kalman=kalman,
                    age=0
                )
                self.next_id += 1

            return [{'box': t.box, 'velocity': (0, 0), 'expanded_box': t.box, 'speed': 0.0, 'acceleration': (0, 0)}
                   for t in self.tracks.values()]

        # Track existing objects using optical flow
        tracked_results = []
        unmatched_tracks = list(self.tracks.keys())

        for track_id in list(self.tracks.keys()):
            track = self.tracks[track_id]

            if track.keypoints is not None:
                # Track using optical flow
                new_points, old_points = self._track_keypoints(
                    self.prev_gray, curr_gray, track.keypoints
                )

                if new_points is not None:
                    # Update box position based on keypoint motion
                    new_box, velocity = self._update_box_from_keypoints(
                        track.box, old_points, new_points
                    )

                    # Clip to frame boundaries
                    new_box = [
                        max(0, new_box[0]),
                        max(0, new_box[1]),
                        min(w, new_box[2]),
                        min(h, new_box[3])
                    ]

                    # Update Kalman filter with new measurement
                    cx, cy = (new_box[0] + new_box[2]) / 2, (new_box[1] + new_box[3]) / 2
                    track.kalman.correct(np.array([[cx], [cy]], dtype=np.float32))

                    # Predict next state (for future use)
                    track.kalman.predict()

                    # Store previous velocity before updating
                    track.prev_velocity = track.velocity

                    # Use optical flow result directly for current frame
                    track.box = new_box
                    track.velocity = velocity
                    track.keypoints = new_points
                    track.age += 1
                else:
                    # Tracking failed - use Kalman prediction only
                    prediction = track.kalman.predict()
                    pred_cx, pred_cy = prediction[0, 0], prediction[1, 0]
                    pred_vx, pred_vy = prediction[2, 0], prediction[3, 0]

                    width = track.box[2] - track.box[0]
                    height = track.box[3] - track.box[1]
                    track.box = [
                        pred_cx - width / 2,
                        pred_cy - height / 2,
                        pred_cx + width / 2,
                        pred_cy + height / 2
                    ]
                    track.velocity = (pred_vx, pred_vy)
                    track.keypoints = None
                    track.age += 1
            else:
                # No keypoints - use Kalman prediction
                prediction = track.kalman.predict()
                pred_cx, pred_cy = prediction[0, 0], prediction[1, 0]
                pred_vx, pred_vy = prediction[2, 0], prediction[3, 0]

                width = track.box[2] - track.box[0]
                height = track.box[3] - track.box[1]
                track.box = [
                    pred_cx - width / 2,
                    pred_cy - height / 2,
                    pred_cx + width / 2,
                    pred_cy + height / 2
                ]
                track.velocity = (pred_vx, pred_vy)
                track.age += 1

            # Check if track is still alive
            if not track.is_alive():
                del self.tracks[track_id]
                continue

            # Calculate acceleration and expand box
            acceleration = track.get_acceleration()
            expanded_box = self._expand_box_by_velocity(track.box, track.velocity, acceleration)
            speed = np.sqrt(track.velocity[0]**2 + track.velocity[1]**2)
            accel_mag = np.sqrt(acceleration[0]**2 + acceleration[1]**2)

            tracked_results.append({
                'id': track_id,
                'box': track.box,
                'velocity': track.velocity,
                'acceleration': acceleration,
                'expanded_box': expanded_box,
                'speed': speed,
                'accel_magnitude': accel_mag,
                'age': track.age
            })

        # Match new detections to existing tracks
        matched_tracks = set()
        for det in detections:
            best_iou = 0.3  # Minimum IoU threshold
            best_track_id = None

            for result in tracked_results:
                iou = self._iou(det, result['box'])
                if iou > best_iou:
                    best_iou = iou
                    best_track_id = result['id']

            if best_track_id is not None:
                # Update existing track with fresh detection
                track = self.tracks[best_track_id]
                track.box = det
                track.keypoints = self._extract_keypoints(curr_gray, det)
                track.age = 0  # Reset age
                matched_tracks.add(best_track_id)

                # Update Kalman with new measurement
                cx, cy = (det[0] + det[2]) / 2, (det[1] + det[3]) / 2
                track.kalman.correct(np.array([[cx], [cy]], dtype=np.float32))

                # Update result
                for r in tracked_results:
                    if r['id'] == best_track_id:
                        r['box'] = det
                        r['expanded_box'] = self._expand_box_by_velocity(det, track.velocity)
                        break
            else:
                # New detection - create new track
                keypoints = self._extract_keypoints(curr_gray, det)
                kalman = self._create_kalman_filter()

                cx, cy = (det[0] + det[2]) / 2, (det[1] + det[3]) / 2
                kalman.statePost = np.array([[cx], [cy], [0], [0]], dtype=np.float32)

                self.tracks[self.next_id] = TrackedObject(
                    id=self.next_id,
                    box=det,
                    velocity=(0.0, 0.0),
                    prev_velocity=(0.0, 0.0),
                    keypoints=keypoints,
                    kalman=kalman,
                    age=0
                )

                tracked_results.append({
                    'id': self.next_id,
                    'box': det,
                    'velocity': (0, 0),
                    'acceleration': (0, 0),
                    'expanded_box': det,
                    'speed': 0.0,
                    'accel_magnitude': 0.0,
                    'age': 0
                })

                self.next_id += 1

        # Update previous frame
        self.prev_gray = curr_gray

        return tracked_results

    def reset(self):
        """Reset tracker state."""
        self.prev_gray = None
        self.tracks = {}
        self.next_id = 0
        print("[MotionTracker] Reset tracking state")
