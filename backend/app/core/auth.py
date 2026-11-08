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
    secret = (
        os.getenv("BETTER_AUTH_SECRET")
        or os.getenv("JWT_SECRET")
        or settings.SECRET_KEY
    )
    if not secret:
        if settings.ENVIRONMENT == "production":
            raise RuntimeError("CRITICAL: JWT_SECRET or BETTER_AUTH_SECRET must be configured in production.")
        secret = "asterra_auth_secret_dev_only_key_2026"
    return secret

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

def get_current_superadmin(request: Request) -> Dict[str, Any]:
    payload = get_current_admin(request)
    if payload.get("role") != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Operasi ini memerlukan hak akses superadmin.",
        )
    return payload

def generate_order_access_token(order_id: str, customer_email: str) -> str:
    secret = get_admin_auth_secret()
    token_src = f"{order_id.strip().upper()}:{customer_email.strip().lower()}"
    return hmac.new(secret.encode("utf-8"), token_src.encode("utf-8"), hashlib.sha256).hexdigest()

def verify_order_access_token(order_id: str, customer_email: str, token: Optional[str]) -> bool:
    if not token or not order_id or not customer_email:
        return False
    expected = generate_order_access_token(order_id, customer_email)
    return hmac.compare_digest(token.strip(), expected)

def get_authenticated_session_identity(request: Optional[Request]) -> Optional[Dict[str, Any]]:
    if not request:
        return None

    # 1. Admin or Sales session token check
    admin_token = request.cookies.get("asterra_admin_session")
    if not admin_token:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            admin_token = auth_hdr[7:].strip()

    if admin_token:
        payload = verify_admin_session_token(admin_token)
        if payload:
            return {
                "id": payload.get("id"),
                "email": str(payload.get("email", "")).lower().strip(),
                "name": payload.get("name", ""),
                "role": payload.get("role", "admin"),
                "is_admin": payload.get("role") in ["admin", "superadmin"],
            }

    # 2. Better Auth Customer session check
    cookie_token = (
        request.cookies.get("better-auth.session_token")
        or request.cookies.get("__Secure-better-auth.session_token")
        or request.headers.get("x-customer-session-token")
    )
    if cookie_token:
        raw_token = cookie_token.split(".")[0].strip()
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            from datetime import datetime
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    row = db.execute(
                        text('''
                            SELECT u.id, u.email, u.name, u.role
                            FROM "session" s
                            JOIN "user" u ON s.user_id = u.id
                            WHERE (s.token = :raw_tok OR s.token = :full_tok)
                              AND s.expires_at > :now
                            LIMIT 1
                        '''),
                        {"raw_tok": raw_token, "full_tok": cookie_token, "now": datetime.utcnow()}
                    ).first()
                    if row:
                        return {
                            "id": str(row[0]),
                            "email": str(row[1]).lower().strip(),
                            "name": str(row[2]),
                            "role": str(row[3]) if row[3] else "customer",
                            "is_admin": False,
                        }
                finally:
                    db.close()
        except Exception as e:
            print(f"[Auth] Note: customer session DB check: {e}")

    return None
