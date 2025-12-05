"""
Standard error handling framework with error codes and HTTP status mapping.
Replaces inconsistent error handling patterns across the codebase.
"""
from enum import Enum
from typing import Optional, Dict, Any
from flask import jsonify
from functools import wraps
import traceback
import logging

logger = logging.getLogger(__name__)


class ErrorCode(str, Enum):
    """Standard error codes for the application."""

    # Detector errors (1xxx)
    DETECTOR_NOT_INITIALIZED = "DETECTOR_1001"
    DETECTOR_PROCESSING_FAILED = "DETECTOR_1002"
    DETECTOR_INIT_FAILED = "DETECTOR_1003"
    DETECTOR_MODEL_NOT_FOUND = "DETECTOR_1004"

    # Validation errors (2xxx)
    INVALID_INPUT = "VALIDATION_2001"
    MISSING_REQUIRED_FIELD = "VALIDATION_2002"
    INVALID_FORMAT = "VALIDATION_2003"
    INVALID_ROOM_ID = "VALIDATION_2004"
    INVALID_ZONE_ID = "VALIDATION_2005"

    # Configuration errors (3xxx)
    CONFIG_INVALID = "CONFIG_3001"
    CONFIG_MISSING = "CONFIG_3002"

    # Resource errors (4xxx)
    ROOM_NOT_FOUND = "RESOURCE_4001"
    ZONE_NOT_FOUND = "RESOURCE_4002"
    EMBEDDING_NOT_FOUND = "RESOURCE_4003"

    # Queue/Performance errors (5xxx)
    QUEUE_FULL = "QUEUE_5001"
    REQUEST_TIMEOUT = "QUEUE_5002"
    REQUEST_TOO_OLD = "QUEUE_5003"

    # External service errors (6xxx)
    INSIGHTFACE_NOT_AVAILABLE = "EXTERNAL_6001"
    FACE_DETECTION_FAILED = "EXTERNAL_6002"

    # System errors (9xxx)
    INTERNAL_ERROR = "SYSTEM_9001"
    NOT_IMPLEMENTED = "SYSTEM_9002"


# Error code to HTTP status mapping
ERROR_STATUS_MAP: Dict[ErrorCode, int] = {
    # 4xx client errors
    ErrorCode.INVALID_INPUT: 400,
    ErrorCode.MISSING_REQUIRED_FIELD: 400,
    ErrorCode.INVALID_FORMAT: 400,
    ErrorCode.INVALID_ROOM_ID: 400,
    ErrorCode.INVALID_ZONE_ID: 400,
    ErrorCode.CONFIG_INVALID: 400,

    ErrorCode.ROOM_NOT_FOUND: 404,
    ErrorCode.ZONE_NOT_FOUND: 404,
    ErrorCode.EMBEDDING_NOT_FOUND: 404,
    ErrorCode.CONFIG_MISSING: 404,

    ErrorCode.NOT_IMPLEMENTED: 501,

    # 5xx server errors
    ErrorCode.DETECTOR_NOT_INITIALIZED: 503,
    ErrorCode.DETECTOR_PROCESSING_FAILED: 500,
    ErrorCode.DETECTOR_INIT_FAILED: 500,
    ErrorCode.DETECTOR_MODEL_NOT_FOUND: 500,
    ErrorCode.INSIGHTFACE_NOT_AVAILABLE: 503,
    ErrorCode.FACE_DETECTION_FAILED: 500,
    ErrorCode.INTERNAL_ERROR: 500,

    # 429 rate limiting
    ErrorCode.QUEUE_FULL: 429,
    ErrorCode.REQUEST_TIMEOUT: 408,
    ErrorCode.REQUEST_TOO_OLD: 408,
}


class AppError(Exception):
    """
    Base application error with error code and HTTP status support.

    All application errors should inherit from this class or use it directly.
    """

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        http_status: Optional[int] = None,
    ):
        """
        Initialize application error.

        Args:
            code: Error code from ErrorCode enum
            message: Human-readable error message
            details: Optional additional error details
            http_status: Optional HTTP status code (defaults to mapped value)
        """
        self.code = code
        self.message = message
        self.details = details or {}
        self.http_status = http_status or ERROR_STATUS_MAP.get(code, 500)
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for JSON response."""
        return {
            "error": {
                "code": self.code.value,
                "message": self.message,
                "details": self.details,
            }
        }


class DetectorError(AppError):
    """Error related to detection models/processing."""

    def __init__(self, message: str, code: ErrorCode = ErrorCode.DETECTOR_PROCESSING_FAILED, **kwargs):
        super().__init__(code=code, message=message, **kwargs)


class ValidationError(AppError):
    """Error related to input validation."""

    def __init__(self, message: str, field: Optional[str] = None, **kwargs):
        details = kwargs.pop('details', {})
        if field:
            details['field'] = field
        super().__init__(
            code=ErrorCode.INVALID_INPUT,
            message=message,
            details=details,
            **kwargs
        )


class ConfigError(AppError):
    """Error related to configuration."""

    def __init__(self, message: str, **kwargs):
        super().__init__(
            code=ErrorCode.CONFIG_INVALID,
            message=message,
            **kwargs
        )


def error_handler(func):
    """
    Decorator for Flask routes to handle errors consistently.

    Catches AppError and returns proper JSON response.
    Catches all other exceptions and returns 500 error.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except AppError as e:
            logger.warning(
                f"Application error in {func.__name__}: {e.code.value} - {e.message}",
                extra={'error_code': e.code.value, 'details': e.details}
            )
            return jsonify(e.to_dict()), e.http_status
        except Exception as e:
            logger.error(
                f"Unexpected error in {func.__name__}: {str(e)}",
                exc_info=True
            )
            error = AppError(
                code=ErrorCode.INTERNAL_ERROR,
                message="An unexpected error occurred",
                details={"original_error": str(e), "traceback": traceback.format_exc()}
            )
            return jsonify(error.to_dict()), 500

    return wrapper
