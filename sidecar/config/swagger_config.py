"""
Swagger/OpenAPI Configuration for PrivaStream API.

Provides comprehensive API documentation with:
- OpenAPI 3.0 specification
- Interactive Swagger UI
- Complete endpoint documentation
- Request/response schemas
- Authentication details
"""

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,  # Include all endpoints
            "model_filter": lambda tag: True,  # Include all models
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs"
}

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "PrivaStream API",
        "description": """
# PrivaStream Real-Time Privacy Filter API

A production-ready API for real-time privacy filtering in livestreams and videos.

## Features

**Video PII Detection & Blur:**
- Face detection with optional mouth-only blur
- License plate detection (YOLO-based)
- Street/address text detection (OCR + PII classifier)
- Whitelist functionality for authorized faces
- Temporal stabilization to prevent blur flicker

**Audio PII Detection:**
- Whisper speech-to-text processing
- Fine-tuned DeBERTa for PII token detection
- Real-time mouth blur synchronized with spoken PII
- Multi-class detection (names, addresses, phone numbers, emails, SSNs)

## API Design Principles

- RESTful architecture
- JSON request/response format
- Comprehensive error handling
- Performance metrics and monitoring
- Real-time processing capabilities
- Scalable queue management

## Base URL

```
http://localhost:5000/api
```

## Response Format

All successful responses follow this structure:
```json
{
  "success": true,
  "data": { ... }
}
```

Error responses follow this structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

## Rate Limiting

The API implements queue-based rate limiting:
- Max concurrent requests: Configurable (default: 10)
- Request dropping: Enabled for stale requests
- Max request age: Configurable (default: 5000ms)

## Performance

- Real-time processing: < 50ms per frame (typical)
- Detection FPS: 5-30 FPS (adaptive)
- Cache hit rate: 70-90% (typical)
- GPU-accelerated processing

## Support

For issues and questions, please refer to:
- GitHub: https://github.com/your-org/privastream
- Documentation: /docs/
        """,
        "version": "2.0.0",
        "contact": {
            "name": "PrivaStream Team",
            "email": "support@privastream.com",
            "url": "https://privastream.com"
        },
        "license": {
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT"
        }
    },
    "host": "localhost:5000",
    "basePath": "",
    "schemes": ["http", "https"],
    "securityDefinitions": {
        "ApiKeyAuth": {
            "type": "apiKey",
            "name": "X-API-Key",
            "in": "header",
            "description": "API key for authentication (if enabled)"
        }
    },
    "tags": [
        {
            "name": "Processing",
            "description": "Frame processing and detection endpoints"
        },
        {
            "name": "Face Detection",
            "description": "Face detection and whitelist management"
        },
        {
            "name": "Room Management",
            "description": "Room configuration and privacy zones"
        },
        {
            "name": "Metrics",
            "description": "Performance monitoring and statistics"
        },
        {
            "name": "Debug",
            "description": "Debug and configuration endpoints"
        },
        {
            "name": "Health",
            "description": "Health check and status endpoints"
        }
    ],
    "definitions": {
        "Rectangle": {
            "type": "object",
            "properties": {
                "x1": {"type": "integer", "minimum": 0, "description": "Top-left X coordinate"},
                "y1": {"type": "integer", "minimum": 0, "description": "Top-left Y coordinate"},
                "x2": {"type": "integer", "minimum": 0, "description": "Bottom-right X coordinate"},
                "y2": {"type": "integer", "minimum": 0, "description": "Bottom-right Y coordinate"},
                "type": {"type": "string", "enum": ["face", "plate", "pii"], "description": "Detection type"},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1, "description": "Detection confidence"}
            },
            "required": ["x1", "y1", "x2", "y2"]
        },
        "DetectedFace": {
            "type": "object",
            "properties": {
                "bbox": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "minItems": 4,
                    "maxItems": 4,
                    "description": "Bounding box [x1, y1, x2, y2]"
                },
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                "embedding": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "Face embedding vector (512-dim)"
                },
                "is_whitelisted": {"type": "boolean"}
            },
            "required": ["bbox", "confidence"]
        },
        "PrivacyZone": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "Unique zone identifier"},
                "region": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "minItems": 4,
                    "maxItems": 4,
                    "description": "Zone coordinates [x1, y1, x2, y2]"
                },
                "shape": {"type": "string", "enum": ["rectangle", "ellipse"], "default": "rectangle"},
                "blur_strength": {"type": "integer", "minimum": 0, "maximum": 255, "default": 75},
                "label": {"type": "string", "description": "Optional zone label"}
            },
            "required": ["id", "region"]
        },
        "ErrorResponse": {
            "type": "object",
            "properties": {
                "error": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string", "description": "Error code (e.g., VALIDATION_2001)"},
                        "message": {"type": "string", "description": "Human-readable error message"},
                        "details": {"type": "object", "description": "Additional error details"}
                    },
                    "required": ["code", "message"]
                }
            },
            "required": ["error"]
        }
    }
}
