import librosa
import numpy as np
import logging
from typing import List, Dict, Any, Optional
import io
import soundfile as sf

logger = logging.getLogger(__name__)

class CopyrightService:
    """
    Service for detecting copyrighted audio using spectral fingerprinting.
    Designed for serverless execution (stateless).
    """

    def __init__(self):
        # In a real production app, this would connect to a vector DB (e.g., Pinecone/Milvus)
        # For this demo/MVP, we use a hardcoded "Blocklist" of spectral signatures.
        self.blocklist_signatures = self._load_mock_blocklist()

    def _load_mock_blocklist(self) -> List[Dict[str, Any]]:
        """
        Loads a mock database of copyrighted song fingerprints.
        In reality, these would be loaded from a DB or S3.
        """
        return [
            {
                "id": "song_1",
                "title": "Copyrighted Pop Hit 2024",
                "artist": "Famous Singer",
                # Mock fingerprint: A specific MFCC pattern (simplified for demo)
                # This represents a "high energy" pop song signature
                "fingerprint_mean": np.array([-100.0, 120.0, -20.0, 40.0, -10.0]), 
                "threshold": 15.0 
            },
            {
                "id": "song_2",
                "title": "Epic Movie Score",
                "artist": "Orchestra",
                # Mock fingerprint: Classical/Orchestral signature
                "fingerprint_mean": np.array([-200.0, 80.0, -40.0, 10.0, -5.0]),
                "threshold": 15.0
            }
        ]

    def analyze_audio(self, audio_bytes: bytes, sample_rate: int = 22050) -> Dict[str, Any]:
        """
        Analyze an audio chunk for copyright violations.

        Args:
            audio_bytes: Raw audio data (wav/mp3)
            sample_rate: Target sample rate for analysis

        Returns:
            Dict containing match result and metadata.
        """
        try:
            # Load audio from bytes
            # librosa.load expects a file path or file-like object
            with io.BytesIO(audio_bytes) as audio_file:
                y, sr = librosa.load(audio_file, sr=sample_rate)

            # Extract Features (MFCCs - Mel-frequency cepstral coefficients)
            # We take the mean of the MFCCs over time to get a "summary" fingerprint of the chunk
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=5)
            fingerprint = np.mean(mfcc, axis=1)

            # Compare against blocklist
            match = self._find_match(fingerprint)

            if match:
                logger.warning(f"Copyright match found: {match['title']}")
                return {
                    "detected": True,
                    "match_id": match["id"],
                    "title": match["title"],
                    "artist": match["artist"],
                    "confidence": 0.95 # Mock confidence
                }
            
            return {"detected": False}

        except Exception as e:
            logger.error(f"Audio analysis failed: {e}")
            return {"detected": False, "error": str(e)}

    def _find_match(self, input_fingerprint: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Compare input fingerprint against blocklist using Euclidean distance.
        """
        for song in self.blocklist_signatures:
            target_fp = song["fingerprint_mean"]
            threshold = song["threshold"]
            
            # Calculate Euclidean distance
            dist = np.linalg.norm(input_fingerprint - target_fp)
            
            if dist < threshold:
                return song
        
        return None
