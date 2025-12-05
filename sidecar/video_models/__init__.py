"""
PrivaStream Video Models Package

This package contains all AI model implementations for video processing:
- Face detection and blurring
- License plate detection and blurring
- PII (text) detection and blurring
- Unified detector orchestration
- Processing pipelines
"""

from .unified_detector import UnifiedBlurDetector


__all__ = ['UnifiedBlurDetector']
