import cv2
import pyvirtualcam
import numpy as np
import time
import sys
import os
from pathlib import Path

# Add current directory to path so imports work
sys.path.append(str(Path(__file__).parent))

from services.processing_service import ProcessingService
from services.detector_service import DetectorService
from services.room_service import RoomService
from services.cache_service import CacheService
from services.metrics_service import MetricsService
from services.content_safety_service import ContentSafetyService
from services.copyright_service import CopyrightService
from config.settings import get_settings
from core.logging import get_logger

logger = get_logger(__name__)

def main():
    print("🚀 Starting PrivaStream Local Virtual Camera...")
    
    # 1. Load Settings & Services
    print("⚙️ Loading AI Models (this may take a moment)...")
    settings = get_settings()
    
    # Initialize Services
    detector = DetectorService(settings)
    detector.initialize()
    
    # Optional: Enable Content Safety if you want it locally
    # Note: This might be heavy for some local machines without GPU
    content_safety = ContentSafetyService(use_gpu=False) 
    
    copyright_service = CopyrightService()
    
    processor = ProcessingService(
        settings=settings,
        detector_service=detector,
        room_service=RoomService(),
        cache_service=CacheService(settings),
        metrics_service=MetricsService(),
        content_safety_service=content_safety,
        copyright_service=copyright_service
    )
    
    print("✅ Models Loaded!")

    # 2. Open Webcam
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Error: Could not open webcam.")
        return

    # Get webcam properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    
    print(f"📷 Webcam opened: {width}x{height} @ {fps}fps")

    # 3. Start Virtual Camera
    try:
        with pyvirtualcam.Camera(width=width, height=height, fps=fps, fmt=pyvirtualcam.PixelFormat.BGR) as cam:
            print(f"🎥 Virtual Camera started: {cam.device}")
            print("Press 'q' in the preview window to quit.")
            
            frame_count = 0
            while True:
                # Read frame
                ret, frame = cap.read()
                if not ret:
                    print("⚠️ Failed to read frame")
                    break
                
                # Process frame
                # We use the synchronous helper directly since we are in a simple loop
                # and don't need the async overhead of the full pipeline for this script
                # However, to use the full logic including safety/copyright, we can call the internal methods
                
                # Run detection pipeline (Face Blur / PII)
                # Note: We are passing None for room_id and provided_rectangles for basic usage
                processed_frame, _ = processor._run_detection_pipeline(
                    frame=frame,
                    frame_id=frame_count,
                    room_id=None,
                    blur_only=False,
                    provided_rectangles=None,
                    active_models=["face"] # Default to face blurring
                )
                
                # Decode the result because _run_detection_pipeline returns base64
                # This is a bit inefficient for local loop (encode -> decode), 
                # but reuses the exact same logic as the backend.
                # Optimization: We could refactor ProcessingService to return raw frames, 
                # but for now we stick to the existing API to avoid breaking changes.
                final_frame = processor.decode_frame(processed_frame)
                
                # Send to Virtual Camera
                cam.send(final_frame)
                
                # Wait for next frame
                cam.sleep_until_next_frame()
                
                frame_count += 1
                
    except pyvirtualcam.PixelFormatError as e:
        print(f"❌ Virtual Camera Error: {e}")
        print("Tip: Make sure OBS Virtual Camera is installed and not in use by another app.")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
    finally:
        cap.release()
        print("fw Exiting...")

if __name__ == "__main__":
    main()
