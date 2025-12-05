"""
Structured logging framework replacing scattered print statements.
Provides consistent logging with proper levels, formatting, and context.
"""
import logging
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional
from functools import lru_cache


class ContextualFilter(logging.Filter):
    """Add contextual information to log records."""

    def filter(self, record):
        if not hasattr(record, 'room_id'):
            record.room_id = 'N/A'
        if not hasattr(record, 'request_id'):
            record.request_id = 'N/A'
        return True


def setup_logging(
    log_level: str = "INFO",
    log_file: Optional[Path] = None,
    enable_console: bool = True
) -> None:
    """
    Setup application-wide logging configuration.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional path to log file
        enable_console: Whether to log to console
    """
    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # Remove existing handlers
    root_logger.handlers.clear()

    # Define formatter with contextual info
    formatter = logging.Formatter(
        fmt='%(asctime)s | %(levelname)-8s | %(name)-20s | %(room_id)-12s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Add contextual filter
    contextual_filter = ContextualFilter()

    # Console handler
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, log_level.upper()))
        console_handler.setFormatter(formatter)
        console_handler.addFilter(contextual_filter)
        root_logger.addHandler(console_handler)

    # File handler (if specified)
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)  # Always log everything to file
        file_handler.setFormatter(formatter)
        file_handler.addFilter(contextual_filter)
        root_logger.addHandler(file_handler)

    # Suppress noisy third-party loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    logging.getLogger("insightface").setLevel(logging.WARNING)


@lru_cache()
def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a module.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


class LoggerAdapter(logging.LoggerAdapter):
    """Logger adapter for adding contextual information to log messages."""

    def process(self, msg, kwargs):
        """Add contextual fields to log message."""
        extra = kwargs.get('extra', {})

        # Add room_id if available
        if 'room_id' in self.extra:
            extra['room_id'] = self.extra['room_id']

        # Add request_id if available
        if 'request_id' in self.extra:
            extra['request_id'] = self.extra['request_id']

        kwargs['extra'] = extra
        return msg, kwargs


def get_contextual_logger(name: str, **context) -> LoggerAdapter:
    """
    Get a logger with contextual information.

    Args:
        name: Logger name
        **context: Contextual fields (room_id, request_id, etc.)

    Returns:
        Logger adapter with context
    """
    logger = get_logger(name)
    return LoggerAdapter(logger, context)
