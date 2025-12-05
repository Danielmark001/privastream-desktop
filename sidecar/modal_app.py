import modal

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import sys
import os
import time

# Define the Modal Stub (Application)
app = modal.App("privastream-backend")

# Define the container image with dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("libgl1-mesa-glx", "libglib2.0-0", "ffmpeg")  # OpenCV dependencies
    .pip_install(
        "fastapi",
        "flask",
        "flask-cors",
        "opencv-python-headless",
        "numpy",
        "pydantic",
        "pydantic-settings",
        "paddlepaddle-gpu==2.6.0",
        "paddleocr>=2.7.0.3",
        "ultralytics",
        "librosa",
        "soundfile"
    )
    .add_local_dir(
        local_path=Path(__file__).parent,
        remote_path="/root/app"
    )
)

@app.cls(
    image=image,
    gpu="T4",  # Request a T4 GPU (16GB VRAM)
    timeout=600,  # 10 minutes timeout
    container_idle_timeout=60,  # Spin down after 60s of inactivity
    concurrency_limit=10, # Allow 10 concurrent containers
    allow_concurrent_inputs=4 # Limit to 4 streams per GPU for high FPS
)
class VideoProcessor:
    def __init__(self):
        self.processor = None
        self.detector = None
        self.content_safety = None
        self.copyright_service = None
        self.init_error = None

    def __enter__(self):
        """
        Container startup.
        """
        # Ensure path is set
        sys.path.append("/root/app")

    def _initialize(self):
        """Lazy initialization of AI models."""
        if getattr(self, 'processor', None):
            return

        print("🥶 Cold Start: Loading AI Models into GPU Memory...")
        
        # DEBUG: Print environment info
        import os
        print(f"DEBUG: CWD = {os.getcwd()}")
        print(f"DEBUG: sys.path = {sys.path}")
        try:
            print(f"DEBUG: /root contents = {os.listdir('/root')}")
            if os.path.exists("/root/app"):
                print(f"DEBUG: /root/app contents = {os.listdir('/root/app')}")
            else:
                print("DEBUG: /root/app DOES NOT EXIST")
        except Exception as e:
            print(f"DEBUG: Error listing dirs: {e}")

        # Ensure path is set (redundant but safe)
        if "/root/app" not in sys.path:
            sys.path.append("/root/app")
            
        from services.processing_service import ProcessingService
        from services.detector_service import DetectorService
        from services.room_service import RoomService
        from services.cache_service import CacheService
        from services.metrics_service import MetricsService
        from services.content_safety_service import ContentSafetyService
        from services.copyright_service import CopyrightService
        from config.settings import get_settings
        
        settings = get_settings()
        
        # 1. Load Face Detector (Lightweight)
        self.detector = DetectorService(settings)
        # Disable recognition (SFace) for speed - only detection (YuNet) needed for blur
        self.detector.initialize(enable_recognition=False) 
        
        # 2. Load Content Safety (YOLO + PaddleOCR) - HEAVY
        self.content_safety = ContentSafetyService(use_gpu=True)
        
        # 3. Load Copyright Service (Audio Fingerprinting)
        self.copyright_service = CopyrightService()
        
        # 4. Initialize Processor
        self.processor = ProcessingService(
            settings=settings,
            detector_service=self.detector,
            room_service=RoomService(),
            cache_service=CacheService(settings),
            metrics_service=MetricsService(),
            content_safety_service=self.content_safety,
            copyright_service=self.copyright_service
        )
        print("✅ Models Loaded! Ready to process streams.")

    @modal.web_endpoint(method="POST")
    async def process_frame_endpoint(self, item: dict):
        """
        Serverless endpoint to process a single video frame.
        """
        # Handle Warm-up Request
        if item.get("warmup"):
            try:
                self._initialize()
                return {"success": True, "message": "Backend is warm and ready!"}
            except Exception as e:
                import traceback
                return {"error": f"Warmup Failed: {str(e)}\n{traceback.format_exc()}"}

        # Extract data
        frame_b64 = item.get("frame")
        audio_b64 = item.get("audio") # Optional audio chunk
        options = item.get("options", {})
        
        active_models = item.get("active_models")
        
        if not frame_b64:
            return {"error": "No frame provided"}

        # Lazy Initialize
        try:
            self._initialize()
        except Exception as e:
            import traceback
            return {"error": f"Backend Init Failed: {str(e)}\n{traceback.format_exc()}"}
        
        if not self.processor:
             return {"error": "Backend not initialized (Processor is None)"}
            
        try:
            # Decode
            frame = self.processor.decode_frame(frame_b64)
            
            # Decode Audio if present
            audio_chunk = None
            if audio_b64:
                import base64
                audio_chunk = base64.b64decode(audio_b64)

            # Frame Skipping for Performance
            # Only process every 3rd frame fully (stride=3)
            # The detector will use tracking for intermediate frames
            stride = 3
            
            try:
                # Using the lazy-loaded processor
                encoded_frame, metadata = await self.processor.process_frame_async(
                    frame=frame,
                    frame_id=item.get("frameId", 0),
                    room_id=options.get("room_id"),
                    active_models=active_models,
                    enable_safety=False, # Disable for speed
                    enable_copyright=False # Disable for speed
                )
                
                # DEBUG: Print detection count and active models
                detections = metadata.get("detections", [])
                print(f"✅ Frame {item.get('frameId', 0)}: Active models={active_models}, Detections={len(detections)}")
                if len(detections) > 0:
                    print(f"   → Detected: {', '.join([d.get('type', 'unknown') for d in detections])}")
                
                
                return {
                    "processed_frame": encoded_frame,
                    "metadata": metadata
                }
            except Exception as e:
                import traceback
                print(f"Processing Error: {e}\n{traceback.format_exc()}")
                return {"error": str(e)}
            
        except Exception as e:
            return {"error": str(e)}

    @modal.web_endpoint(method="POST")
    async def enroll_face_endpoint(self, item: dict):
        """
        Endpoint to enroll a face from multiple images.
        Returns the averaged 128-d embedding.
        """
        frames_b64 = item.get("frames")
        if not frames_b64 or not isinstance(frames_b64, list):
            # Fallback for single frame legacy calls
            frame_b64 = item.get("frame")
            if frame_b64:
                frames_b64 = [frame_b64]
            else:
                return {"error": "No frames provided"}
            
        try:
            embeddings = []
            
            for f_b64 in frames_b64:
                try:
                    # Decode
                    frame = self.processor.decode_frame(f_b64)
                    # Extract Embedding
                    emb = self.detector.extract_face_embedding(frame)
                    if emb is not None:
                        embeddings.append(emb)
                except Exception as e:
                    print(f"Frame processing error: {e}")
                    continue
            
            if not embeddings:
                return {
                    "success": False,
                    "error": "No valid faces detected in any frame"
                }
                
            # Average embeddings
            import numpy as np
            mean_emb = np.mean(np.stack(embeddings, axis=0), axis=0)
            
            return {
                "success": True,
                "embedding": mean_emb.tolist(),
                "samples": len(embeddings)
            }
                
        except Exception as e:
            return {"error": str(e)}

# Warm-up is no longer strictly needed as a separate function 
# because __enter__ handles it, but we can keep a trigger if desired.
@app.function(image=image, gpu="T4")
def warm_up():
    """Triggers a cold start to pre-load a container"""
    VideoProcessor()
    print("Warm-up trigger complete!")
