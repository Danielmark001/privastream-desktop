"""
Enroll the creator's face using SFace (OpenCV).
Captures frames, extracts embeddings, and saves the average to whitelist/creator_embedding.json.
"""
import argparse
import json
import cv2
import numpy as np
from pathlib import Path
import time

def download_models():
    """Download YuNet and SFace models if missing"""
    model_dir = Path("models/weights/face")
    model_dir.mkdir(parents=True, exist_ok=True)
    
    models = {
        "face_detection_yunet_2023mar.onnx": "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        "face_recognition_sface_2021dec.onnx": "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
    }
    
    import urllib.request
    
    for filename, url in models.items():
        path = model_dir / filename
        if not path.exists():
            print(f"Downloading {filename}...")
            urllib.request.urlretrieve(url, path)
            print(f"Downloaded {filename}")
            
    return model_dir

def enroll(out_path: str, cam_source: str, shots: int):
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    
    model_dir = download_models()
    
    # Init Detector (YuNet)
    detector = cv2.FaceDetectorYN.create(
        model=str(model_dir / "face_detection_yunet_2023mar.onnx"),
        config="",
        input_size=(640, 480),
        score_threshold=0.6,
        nms_threshold=0.3,
        top_k=5000,
        backend_id=cv2.dnn.DNN_BACKEND_DEFAULT,
        target_id=cv2.dnn.DNN_TARGET_CPU
    )
    
    # Init Recognizer (SFace)
    recognizer = cv2.FaceRecognizerSF.create(
        model=str(model_dir / "face_recognition_sface_2021dec.onnx"),
        config="",
        backend_id=cv2.dnn.DNN_BACKEND_DEFAULT,
        target_id=cv2.dnn.DNN_TARGET_CPU
    )
    
    cap = cv2.VideoCapture(int(cam_source) if cam_source.isdigit() else cam_source)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open camera: {cam_source}")
        return
        
    embs = []
    print(f"[Enroll] Capture {shots} frames. Look at the camera. Press 'q' to quit.")
    
    while len(embs) < shots:
        ret, frame = cap.read()
        if not ret: break
        
        h, w = frame.shape[:2]
        detector.setInputSize((w, h))
        
        # Detect
        _, faces = detector.detect(frame)
        
        if faces is not None:
            # Get largest face
            face = max(faces, key=lambda x: x[2] * x[3])
            
            # Draw box
            x, y, w_box, h_box = face[:4].astype(int)
            cv2.rectangle(frame, (x, y), (x+w_box, y+h_box), (0, 255, 0), 2)
            
            # Extract Embedding
            aligned_face = recognizer.alignCrop(frame, face)
            feat = recognizer.feature(aligned_face)
            embs.append(feat)
            
            cv2.putText(frame, f"Captured: {len(embs)}/{shots}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
        cv2.imshow("Enroll Face (SFace)", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
    
    if not embs:
        print("[Enroll] No embeddings captured.")
        return
        
    # Average embeddings
    mean_emb = np.mean(np.stack(embs, axis=0), axis=0)
    
    # Save
    out.write_text(json.dumps({
        "embedding": mean_emb.tolist(),
        "model": "sface_2021dec",
        "threshold": 0.363
    }), encoding="utf-8")
    
    print(f"[Enroll] Success! Saved embedding to {out}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="whitelist/creator_embedding.json")
    parser.add_argument("--cam", default="0")
    parser.add_argument("--shots", type=int, default=20)
    args = parser.parse_args()
    
    enroll(args.out, args.cam, args.shots)
