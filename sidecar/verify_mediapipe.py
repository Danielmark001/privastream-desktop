import sys
import os
import cv2
import numpy as np

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from video_models.face_detector_mediapipe import FaceDetector
    print("[TEST] Successfully imported FaceDetector")
except ImportError as e:
    print(f"[TEST] Failed to import FaceDetector: {e}")
    sys.exit(1)

def test_detector():
    print("[TEST] Initializing detector...")
    detector = FaceDetector(smooth_ms=300, dilate_px=12)
    
    # Create synthetic frame
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(frame, (200, 200), (300, 300), (255, 255, 255), -1) # Fake face
    
    print("[TEST] Running detection (Frame 0)...")
    _, rects0 = detector.process_frame(frame, 0, room_id="test_room")
    print(f"[TEST] Frame 0 detections: {len(rects0)}")
    
    # Frame 1: Face removed (should persist due to smoothing)
    frame_empty = np.zeros((480, 640, 3), dtype=np.uint8)
    print("[TEST] Running detection (Frame 1 - Empty)...")
    _, rects1 = detector.process_frame(frame_empty, 1, room_id="test_room")
    print(f"[TEST] Frame 1 detections: {len(rects1)}")
    
    if len(rects0) > 0 and len(rects1) > 0:
        print("[TEST] SUCCESS: Smoothing is working (detections persisted).")
    else:
        print("[TEST] FAILURE: Smoothing not working or no detections.")

if __name__ == "__main__":
    test_detector()
