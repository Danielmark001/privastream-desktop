"""
License Plate Detection and Blurring Module

Provides license plate detection using:
- YOLOv10n (optimized, NMS-free) - recommended
- Legacy YOLO implementation also available
"""

from .plate_detector_v10 import PlateDetectorV10
from .plate_detector_cpu import PlateDetectorCPU

__all__ = ['PlateDetectorV10', 'PlateDetectorCPU']
