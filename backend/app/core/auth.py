import os
import json
import base64
import hashlib
import hmac
import secrets
import time
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException
from app.config import settings

def get_admin_auth_secret() -> str:
    return (
        os.getenv("BETTER_AUTH_SECRET")
        or os.getenv("JWT_SECRET")
        or settings.SECRET_KEY
        or "asterra_auth_secret_fallback_key_2026"
    )

def create_admin_session_token(id_val: str, email: str, role: str, name: str = "") -> str:
    secret = get_admin_auth_secret()
    now_ms = int(time.time() * 1000)
    expires_at_ms = now_ms + (8 * 60 * 60 * 1000)  # 8 hours

    payload = {
        "id": id_val,
        "email": email.strip().lower(),
        "name": name,
        "role": role,
        "issuedAt": now_ms,
        "expiresAt": expires_at_ms,
        "nonce": secrets.token_hex(16),
    }

    payload_json = json.dumps(payload, separators=(',', ':'))
    payload_base64 = base64.urlsafe_b64encode(payload_json.encode('utf-8')).decode('utf-8').rstrip('=')

    sig = hmac.new(secret.encode('utf-8'), payload_base64.encode('utf-8'), hashlib.sha256).digest()
    sig_base64 = base64.urlsafe_b64encode(sig).decode('utf-8').rstrip('=')

    return f"{payload_base64}.{sig_base64}"

def verify_admin_session_token(token: Optional[str]) -> Optional[Dict[str, Any]]:
    if not token or "." not in token:
        return None
    parts = token.split(".")
    if len(parts) != 2:
        return None
    payload_b64, sig_b64 = parts
    secret = get_admin_auth_secret()
    sig_expected = hmac.new(secret.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).digest()
    sig_expected_b64 = base64.urlsafe_b64encode(sig_expected).decode('utf-8').rstrip('=')

    if not hmac.compare_digest(sig_expected_b64, sig_b64):
        return None
    try:
        padding = 4 - (len(payload_b64) % 4)
        if padding != 4:
            payload_b64 += "=" * padding
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode('utf-8')).decode('utf-8'))
        if payload.get("expiresAt") and int(time.time() * 1000) > payload["expiresAt"]:
            return None
        return payload
    except Exception:
        return None

def get_current_admin(request: Request) -> Dict[str, Any]:
    token = request.cookies.get("asterra_admin_session")
    if not token:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Sesi otentikasi administrator tidak ditemukan.",
        )

    payload = verify_admin_session_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Sesi administrator tidak valid atau telah berakhir.",
        )

    if payload.get("role") not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Operasi ini memerlukan hak akses administrator.",
        )

    return payload

def get_current_sales_or_admin(request: Request) -> Dict[str, Any]:
    token = request.cookies.get("asterra_admin_session")
    if not token:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Sesi otentikasi tidak ditemukan.",
        )

    payload = verify_admin_session_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Sesi tidak valid atau telah berakhir.",
        )

    if payload.get("role") not in ["admin", "superadmin", "sales"]:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Memerlukan hak akses mitra sales atau administrator.",
        )

    return payload
