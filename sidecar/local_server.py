import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from pydantic import BaseModel
import threading
import time
import cv2
import pyvirtualcam
import numpy as np
import sys
import collections
from pathlib import Path
import queue
import pyaudio
from better_profanity import profanity

# Initialize profanity filter
profanity.load_censor_words()

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from services.processing_service import ProcessingService
from services.detector_service import DetectorService
from services.room_service import RoomService
from services.cache_service import CacheService
from services.metrics_service import MetricsService
from services.content_safety_service import ContentSafetyService
from services.copyright_service import CopyrightService
from config.settings import get_settings

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="PrivaStream Local Backend")

# Add Rate Limit Middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

class SettingsModel(BaseModel):
    faceBlur: bool = True
    smartDetection: bool = False
    brandSafety: bool = False
    chatModeration: bool = False
    copyrightProtection: bool = False
    irlPrivacy: bool = False
    streamDelay: bool = False
    blurStrength: int = 50

# Audio Capture Class
class AudioCapture:
    def __init__(self, rate=44100, chunk=1024):
        self.rate = rate
        self.chunk = chunk
        self.queue = queue.Queue()
        self.running = False
        self.thread = None
        self.p = pyaudio.PyAudio()
        self.stream = None

    def start(self):
        if self.running: return
        self.running = True
        try:
            self.stream = self.p.open(format=pyaudio.paInt16,
                                      channels=1,
                                      rate=self.rate,
                                      input=True,
                                      frames_per_buffer=self.chunk,
                                      stream_callback=self._callback)
            self.stream.start_stream()
            print("🎙️ Audio Capture Started")
        except Exception as e:
            print(f"❌ Audio Start Error: {e}")
            self.running = False

    def _callback(self, in_data, frame_count, time_info, status):
        if self.running:
            self.queue.put(in_data)
        return (in_data, pyaudio.paContinue)

    def read(self):
        if not self.queue.empty():
            return self.queue.get()
        return None

    def stop(self):
        self.running = False
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
            self.stream = None
        # Don't terminate p here, keep it for restart
        print("mic Audio Capture Stopped")

# Chat Moderation Model
class ChatMessage(BaseModel):
    text: str

@app.post("/moderate-chat")
async def moderate_chat(message: ChatMessage):
    """Check if a message contains profanity."""
    is_clean = not profanity.contains_profanity(message.text)
    censored_text = profanity.censor(message.text) if not is_clean else message.text
    return {"is_safe": is_clean, "censored_text": censored_text}

# Global State
class CameraState:
    is_running = False
    thread = None
    error = None
    settings = SettingsModel()

state = CameraState()

# Global Services
processor = None

def get_processor():
    global processor
    if processor is None:
        print("🔧 Initializing Global Services...")
        settings = get_settings()
        detector = DetectorService(settings)
        detector.initialize()
        
        processor = ProcessingService(
            settings=settings,
            detector_service=detector,
            room_service=RoomService(),
            cache_service=CacheService(settings),
            metrics_service=MetricsService(),
            metrics_service=MetricsService(),
            content_safety_service=ContentSafetyService(use_gpu=settings.performance.use_gpu),
            copyright_service=None
        )
        print("✅ Global Services Initialized")
    return processor

def camera_loop():
    print("🚀 Starting Virtual Camera Loop...")
    cap = None
    cam = None
    
    try:
        # Use global processor
        processor = get_processor()

        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise Exception("Could not open webcam")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30

        with pyvirtualcam.Camera(width=width, height=height, fps=fps, fmt=pyvirtualcam.PixelFormat.BGR) as cam:
            print(f"🎥 Virtual Camera started: {cam.device}")
            
            # Stream Delay Buffer
            stream_buffer = collections.deque()
            DELAY_SECONDS = 10 
            
            # Initialize Audio
            audio_capture = AudioCapture()
            if state.settings.copyrightProtection:
                audio_capture.start() 

            # Safety Optimization State
            safety_rects = [] # Stores [x1, y1, x2, y2]
            SAFETY_INTERVAL = 30

            frame_count = 0
            while state.is_running:
                ret, frame = cap.read()
                if not ret:
                    print("⚠️ Failed to read frame")
                    break
                
                # Manage Audio State
                audio_chunk = None
                if state.settings.copyrightProtection:
                    if not audio_capture.running:
                        audio_capture.start()
                    audio_chunk = audio_capture.read()
                elif audio_capture.running:
                    audio_capture.stop()
                
                # Determine active models based on settings
                active_models = []
                if state.settings.faceBlur:
                    active_models.append("face")
                if state.settings.smartDetection:
                    active_models.append("pii") 
                    # Note: 'object' is handled by ContentSafetyService now
                if state.settings.irlPrivacy:
                    active_models.append("face")
                    active_models.append("pii") 

                # 1. Run Standard Pipeline (Face/PII) - Returns RAW frame now
                processed_frame, _ = processor._run_detection_pipeline(
                    frame=frame,
                    frame_id=frame_count,
                    room_id=None,
                    blur_only=False,
                    provided_rectangles=None,
                    active_models=active_models
                )
                
                # 2. Run Safety Check (YOLO/OCR) - Optimized (Every 30 frames)
                if (state.settings.brandSafety or state.settings.smartDetection) and (frame_count % SAFETY_INTERVAL == 0):
                     if processor.content_safety:
                         # Use original frame for detection
                         safety_result = processor.content_safety.analyze_frame(frame)
                         new_rects = []
                         
                         if not safety_result["is_safe"]:
                             for det in safety_result["detections"]:
                                 # Filter based on settings
                                 if det["type"] == "unsafe_object" and state.settings.smartDetection:
                                     new_rects.append(det["box"]) # [x1, y1, x2, y2]
                                 elif det["type"] == "banned_brand" and state.settings.brandSafety:
                                     # OCR returns polygon, convert to rect
                                     poly = np.array(det["box"], dtype=np.int32)
                                     x, y, w, h = cv2.boundingRect(poly)
                                     new_rects.append([x, y, x + w, y + h])
                         
                         safety_rects = new_rects

                # 3. Apply Safety Blurs (Overlay on processed_frame)
                if safety_rects:
                    for box in safety_rects:
                        x1, y1, x2, y2 = map(int, box)
                        # Clamp to frame dimensions
                        h, w = processed_frame.shape[:2]
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(w, x2), min(h, y2)
                        
                        if x2 > x1 and y2 > y1:
                            roi = processed_frame[y1:y2, x1:x2]
                            # Apply strong blur
                            roi = cv2.GaussianBlur(roi, (51, 51), 0)
                            processed_frame[y1:y2, x1:x2] = roi

                # No decoding needed anymore! processed_frame is already numpy array

                # Stream Delay Logic
                final_frame = processed_frame
                if state.settings.streamDelay:
                    stream_buffer.append(final_frame)
                    buffer_size = int(fps * DELAY_SECONDS)
                    
                    if len(stream_buffer) > buffer_size:
                        delayed_frame = stream_buffer.popleft()
                        cam.send(delayed_frame)
                    else:
                         if len(stream_buffer) > 1:
                             black_frame = np.zeros((height, width, 3), np.uint8)
                             cv2.putText(black_frame, f"Buffering... ({len(stream_buffer)}/{buffer_size})", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                             cam.send(black_frame)
                else:
                    if stream_buffer:
                        stream_buffer.clear()
                    cam.send(final_frame)
                
                cam.sleep_until_next_frame()
                frame_count += 1
                
    except Exception as e:
        print(f"❌ Camera Error: {e}")
        state.error = str(e)
    finally:
        state.is_running = False
        if cap: cap.release()
        print("🛑 Virtual Camera Stopped")
        audio_capture.stop()
        audio_capture.p.terminate()

@app.post("/virtual-camera/start")
@limiter.limit("10/minute")
async def start_camera(request: Request):
    if state.is_running:
        return {"status": "already_running"}
    
    state.is_running = True
    state.error = None
    state.thread = threading.Thread(target=camera_loop)
    state.thread.start()
    return {"status": "started"}

@app.post("/virtual-camera/stop")
@limiter.limit("10/minute")
async def stop_camera(request: Request):
    if not state.is_running:
        return {"status": "not_running"}
    
    state.is_running = False
    if state.thread:
        state.thread.join(timeout=2.0)
    return {"status": "stopped"}
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from pydantic import BaseModel
import threading
import time
import cv2
import pyvirtualcam
import numpy as np
import sys
from pathlib import Path
import os # Added for file operations

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from services.processing_service import ProcessingService
from services.detector_service import DetectorService
from services.room_service import RoomService
from services.cache_service import CacheService
from services.metrics_service import MetricsService
from services.content_safety_service import ContentSafetyService
from services.copyright_service import CopyrightService
from config.settings import get_settings

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="PrivaStream Local Backend")

# Add Rate Limit Middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

class SettingsModel(BaseModel):
    faceBlur: bool = True
    smartDetection: bool = False
    brandSafety: bool = False
    chatModeration: bool = False
    copyrightProtection: bool = False
    irlPrivacy: bool = False
    streamDelay: bool = False
    blurStrength: int = 50

# Global State
class CameraState:
    is_running = False
    thread = None
    error = None
    settings = SettingsModel()

state = CameraState()

def camera_loop():
    print("🚀 Starting Virtual Camera Loop...")
    cap = None
    cam = None
    
    try:
        # Initialize Services
        settings = get_settings()
        detector = DetectorService(settings)
        detector.initialize()
        
        # Use lightweight services for local
        processor = ProcessingService(
            settings=settings,
            detector_service=detector,
            room_service=RoomService(),
            cache_service=CacheService(settings),
            metrics_service=MetricsService(),
            metrics_service=MetricsService(),
            content_safety_service=ContentSafetyService(use_gpu=settings.performance.use_gpu),
            copyright_service=CopyrightService() # Enable Copyright Service
        )

        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise Exception("Could not open webcam")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30

        with pyvirtualcam.Camera(width=width, height=height, fps=fps, fmt=pyvirtualcam.PixelFormat.BGR) as cam:
            print(f"🎥 Virtual Camera started: {cam.device}")
            
            frame_count = 0
            while state.is_running:
                ret, frame = cap.read()
                if not ret:
                    print("⚠️ Failed to read frame")
                    break
                
                # Determine active models based on settings
                active_models = []
                if state.settings.faceBlur:
                    active_models.append("face")
                if state.settings.smartDetection:
                    active_models.append("pii") # Assuming 'pii' covers smart detection for now
                if state.settings.brandSafety:
                    active_models.append("brand")
                if state.settings.irlPrivacy:
                    active_models.append("face")
                    active_models.append("pii") # Aggressive mode

                # Process
                processed_frame, _ = processor._run_detection_pipeline(
                    frame=frame,
                    frame_id=frame_count,
                    room_id=None,
                    blur_only=False,
                    provided_rectangles=None,
                    active_models=active_models
                )
                
                # Decode
                final_frame = processor.decode_frame(processed_frame)
                
                # Send
                cam.send(final_frame)
                cam.sleep_until_next_frame()
                frame_count += 1
                
    except Exception as e:
        print(f"❌ Camera Error: {e}")
        state.error = str(e)
    finally:
        state.is_running = False
        if cap: cap.release()
        print("🛑 Virtual Camera Stopped")

@app.post("/virtual-camera/start")
@limiter.limit("10/minute")
async def start_camera(request: Request):
    if state.is_running:
        return {"status": "already_running"}
    
    state.is_running = True
    state.error = None
    state.thread = threading.Thread(target=camera_loop)
    state.thread.start()
    return {"status": "started"}

@app.post("/virtual-camera/stop")
@limiter.limit("10/minute")
async def stop_camera(request: Request):
    if not state.is_running:
        return {"status": "not_running"}
    
    state.is_running = False
    if state.thread:
        state.thread.join(timeout=2.0)
    return {"status": "stopped"}

@app.get("/virtual-camera/status")
async def get_status():
    return {
        "is_running": state.is_running,
        "error": state.error,
        "settings": state.settings.dict()
    }

@app.get("/settings")
async def get_settings():
    return state.settings

@app.post("/settings")
async def update_settings(settings: SettingsModel):
    state.settings = settings
    print(f"⚙️ Settings updated: {settings}")
    return {"status": "updated", "settings": settings}

class RecordingPath(BaseModel):
    path: str

@app.post("/recordings/list")
async def list_recordings(data: RecordingPath):
    try:
        if not os.path.exists(data.path):
            return {"error": "Directory not found", "files": []}
            
        files = []
        for f in os.listdir(data.path):
            if f.lower().endswith(('.mp4', '.mkv', '.mov', '.flv')):
                full_path = os.path.join(data.path, f)
                stats = os.stat(full_path)
                files.append({
                    "name": f,
                    "path": full_path,
                    "size": stats.st_size,
                    "created": stats.st_ctime,
                    "modified": stats.st_mtime
                })
        
        # Sort by modified time desc
        files.sort(key=lambda x: x['modified'], reverse=True)
        return {"files": files}
    except Exception as e:
        return {"error": str(e), "files": []}

@app.delete("/recordings")
async def delete_recording(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
            return {"status": "deleted"}
        return {"error": "File not found"}
    except Exception as e:
        return {"error": str(e)}

class FrameRequest(BaseModel):
    frame: str
    frame_id: int = 0
    room_id: str = None
    blur_only: bool = False

@app.post("/process-frame")
async def process_frame_endpoint(request: FrameRequest):
    try:
        proc = get_processor()
        
        # Decode frame
        frame = proc.decode_frame(request.frame)
        
        # Process
        processed_frame, metadata = await proc.process_frame_async(
            frame=frame,
            frame_id=request.frame_id,
            room_id=request.room_id,
            blur_only=request.blur_only,
            enable_safety=False, # Disable for speed in this demo
            enable_copyright=False
        )
        
        return {\r
            "success": True,\r
            "processed_frame": processed_frame,\r
            "metadata": metadata\r
        }\r
    except Exception as e:\r
        print(f"Error processing frame: {e}")\r
        return {"success": False, "error": str(e)}\r

# ==================== Whitelist Face Recognition Endpoints ====================

# Global face recognition service
face_recognition_service = None

def get_face_recognition_service():
    global face_recognition_service
    if face_recognition_service is None:
        from services.face_recognition_service import FaceRecognitionService
        print("🔧 Initializing Face Recognition Service...")
        face_recognition_service = FaceRecognitionService()
        face_recognition_service.initialize()
        print("✅ Face Recognition Service Initialized")
    return face_recognition_service

class WhitelistRegisterRequest(BaseModel):
    frames: list  # List of base64 encoded frames
    name: str     # Name for the whitelist entry

@app.post("/whitelist/register")
@limiter.limit("5/minute")  # Limit registration attempts
async def register_whitelist_face(request: Request, data: WhitelistRegisterRequest):
    """
    Register a new face to the whitelist.
    Captures multiple frames and averages embeddings for better accuracy.
    """
    try:
        service = get_face_recognition_service()
        proc = get_processor()
        
        embeddings = []
        
        for frame_b64 in data.frames:
            try:
                # Decode frame
                frame = proc.decode_frame(frame_b64)
                
                # Extract embedding
                embedding = service.extract_embedding(frame)
                if embedding is not None:
                    embeddings.append(embedding)
            except Exception as e:
                print(f"Frame processing error: {e}")
                continue
        
        if not embeddings:
            raise HTTPException(status_code=400, detail="No valid faces detected in any frame")
        
        # Average embeddings
        mean_embedding = np.mean(np.stack(embeddings, axis=0), axis=0)
        
        # Add to whitelist
        success = service.add_to_whitelist(data.name, mean_embedding)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save whitelist entry")
        
        return {
            "success": True,
            "name": data.name,
            "samples": len(embeddings),
            "message": f"Successfully registered {data.name} with {len(embeddings)} samples"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Whitelist registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/whitelist/list")
async def list_whitelist():
    """List all whitelisted faces."""
    try:
        service = get_face_recognition_service()
        whitelist = service.list_whitelist()
        
        return {
            "success": True,
            "whitelist": whitelist,
            "count": len(whitelist)
        }
    except Exception as e:
        print(f"Error listing whitelist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/whitelist/{name}")
@limiter.limit("10/minute")
async def delete_whitelist_face(request: Request, name: str):
    """Remove a face from the whitelist."""
    try:
        service = get_face_recognition_service()
        success = service.remove_from_whitelist(name)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Whitelist entry '{name}' not found")
        
        return {
            "success": True,
            "name": name,
            "message": f"Successfully removed {name} from whitelist"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting whitelist: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/whitelist/info")
async def get_whitelist_info():
    """Get whitelist service information."""
    try:
        service = get_face_recognition_service()
        info = service.get_info()
        
        return {
            "success": True,
            **info
        }
    except Exception as e:
        print(f"Error getting whitelist info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class WhitelistProcessRequest(BaseModel):
    frame: str
    frame_id: int = 0
    dilate_px: int = 12
    blur_strength: int = 50

@app.post("/process-frame-whitelist")
async def process_frame_whitelist(data: WhitelistProcessRequest):
    """
    Process frame with whitelist-based face blurring.
    Only non-whitelisted faces will be blurred.
    """
    try:
        service = get_face_recognition_service()
        proc = get_processor()
        
        # Decode frame
        frame = proc.decode_frame(data.frame)
        
        # Get boxes to blur (non-whitelisted faces only)
        boxes_to_blur = service.process_frame(frame, dilate_px=data.dilate_px)
        
        # Apply blur to non-whitelisted faces
        blurred_frame = frame.copy()
        for (x, y, x2, y2) in boxes_to_blur:
            roi = blurred_frame[y:y2, x:x2]
            if roi.size > 0:
                # Apply Gaussian blur
                ksize = data.blur_strength | 1  # Ensure odd number
                roi = cv2.GaussianBlur(roi, (ksize, ksize), 0)
                blurred_frame[y:y2, x:x2] = roi
        
        # Encode result
        import base64
        _, buffer = cv2.imencode('.jpg', blurred_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        encoded_frame = base64.b64encode(buffer).decode('utf-8')
        
        return {
            "success": True,
            "processed_frame": encoded_frame,
            "metadata": {
                "frame_id": data.frame_id,
                "faces_blurred": len(boxes_to_blur),
                "whitelist_count": len(service.whitelist_embeddings)
            }
        }
        
    except Exception as e:
        print(f"Error processing whitelist frame: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
