from datetime import datetime, timedelta
from typing import Optional, Any
import hashlib
import secrets

try:
    from jose import jwt
except ImportError:
    jwt = None

try:
    import bcrypt
except ImportError:
    bcrypt = None

from app.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    # 1. Try bcrypt if available and hash starts with bcrypt signature ($2a$, $2b$, $2y$)
    if bcrypt and hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            pass
    # 2. Try SHA-256 hash
    sha256_hash = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    if secrets.compare_digest(sha256_hash, hashed_password):
        return True
    # 3. Plaintext fallback (if legacy or test config)
    return secrets.compare_digest(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    if bcrypt:
        try:
            return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        except Exception:
            pass
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def create_access_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    if jwt:
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    # Standard library fallback if jose is not installed
    import json
    import base64
    import hmac
    payload_json = json.dumps(to_encode, default=str)
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode('utf-8')).decode('utf-8').rstrip('=')
    sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode('utf-8').rstrip('=')
    return f"{payload_b64}.{sig_b64}"
