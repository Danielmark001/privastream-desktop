import firebase_admin
from firebase_admin import auth, credentials
from flask import request, jsonify
from functools import wraps
import os
import logging

logger = logging.getLogger(__name__)

def initialize_firebase():
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'serviceAccountKey.json')
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin initialized with service account")
            else:
                # Fallback to default credentials or project ID
                firebase_admin.initialize_app(options={'projectId': 'solgrid-3f3c9'})
                logger.info("Firebase Admin initialized with default credentials")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin: {e}")

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized: No token provided'}), 401

        token = auth_header.split('Bearer ')[1]
        try:
            decoded_token = auth.verify_id_token(token)
            request.user = decoded_token
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return jsonify({'error': 'Unauthorized: Invalid token'}), 401
    return decorated_function
