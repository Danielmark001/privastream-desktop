"""
PII (Personally Identifiable Information) Detection Module

Provides text detection and PII classification using:
- PaddleOCR for text detection (optimized version)
- Legacy docTR implementation also available
"""

from .pii_detector_paddle import PIIDetectorPaddle

__all__ = ['PIIDetectorPaddle']
