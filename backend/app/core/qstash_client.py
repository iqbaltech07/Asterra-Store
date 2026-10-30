import os
from typing import Optional, Dict, Any, List
from fastapi import Request
from app.config import settings

_qstash_instance = None
_qstash_initialized = False

def get_qstash_client():
    """
    Returns a singleton Upstash QStash client if QSTASH_TOKEN is configured.
    Returns None gracefully if running in local environment without QStash.
    """
    global _qstash_instance, _qstash_initialized
    if _qstash_initialized:
        return _qstash_instance

    token = settings.QSTASH_TOKEN or os.getenv("QSTASH_TOKEN", "").strip()
    base_url = (settings.QSTASH_URL or os.getenv("QSTASH_URL", "")).strip().rstrip('/')
    if base_url.endswith("/v2"):
        base_url = base_url[:-3]

    if token:
        try:
            from qstash import QStash
            kwargs = {}
            if base_url:
                kwargs["base_url"] = base_url
            _qstash_instance = QStash(token, **kwargs)
            print(f"[Upstash QStash] Initialized serverless messaging client (endpoint: {base_url or 'default'}).")
        except Exception as e:
            print(f"[Upstash QStash] Client init warning: {e}")
            _qstash_instance = None
    else:
        _qstash_instance = None

    _qstash_initialized = True
    return _qstash_instance

def publish_background_job(
    destination_url: str,
    payload: Dict[str, Any],
    retries: int = 3,
    delay_seconds: Optional[int] = None,
    dedup_id: Optional[str] = None,
) -> bool:
    """
    Publishes an asynchronous background task to QStash push queue.
    Returns True if successfully queued to QStash, False otherwise.
    """
    client = get_qstash_client()
    if client is None:
        return False

    try:
        kwargs: Dict[str, Any] = {
            "url": destination_url,
            "body": payload,
            "retries": retries,
        }
        if delay_seconds:
            kwargs["delay"] = f"{delay_seconds}s"
        if dedup_id:
            kwargs["deduplication_id"] = dedup_id

        # Forward internal secret for webhook verification
        internal_secret = settings.INTERNAL_CRON_SECRET or settings.SECRET_KEY
        if internal_secret:
            kwargs["headers"] = {"x-internal-secret": internal_secret}

        client.message.publish_json(**kwargs)
        return True
    except Exception as e:
        print(f"[Upstash QStash] Publish error (falling back to in-process): {e}")
        return False

def register_cron_job(
    destination_url: str,
    cron_expression: str = "*/15 * * * *",
    schedule_id: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
    retries: int = 3,
) -> Optional[str]:
    """
    Registers or updates a scheduled recurring cron job in Upstash QStash.
    """
    client = get_qstash_client()
    if client is None:
        return None

    try:
        internal_secret = settings.INTERNAL_CRON_SECRET or settings.SECRET_KEY
        headers: Dict[str, str] = {}
        if internal_secret:
            headers["x-internal-secret"] = internal_secret

        sched_id = client.schedule.create_json(
            destination=destination_url,
            cron=cron_expression,
            schedule_id=schedule_id,
            headers=headers if headers else None,
            body=payload or {"source": "qstash-cron"},
            retries=retries,
        )
        return sched_id
    except Exception as e:
        print(f"[Upstash QStash] Schedule registration error: {e}")
        return None

def list_cron_jobs() -> List[Dict[str, Any]]:
    client = get_qstash_client()
    if client is None:
        return []
    try:
        schedules = client.schedule.list()
        result = []
        for s in schedules:
            result.append({
                "schedule_id": getattr(s, "schedule_id", None),
                "destination": getattr(s, "destination", None),
                "cron": getattr(s, "cron", None),
                "created_at": getattr(s, "created_at", None),
                "next_schedule_time": getattr(s, "next_schedule_time", None),
                "paused": getattr(s, "paused", False),
            })
        return result
    except Exception as e:
        print(f"[Upstash QStash] List schedules error: {e}")
        return []

def delete_cron_job(schedule_id: str) -> bool:
    client = get_qstash_client()
    if client is None:
        return False
    try:
        client.schedule.delete(schedule_id)
        return True
    except Exception as e:
        print(f"[Upstash QStash] Delete schedule error: {e}")
        return False

def verify_internal_or_qstash_request(request: Request, raw_body: bytes) -> bool:
    """
    Verifies that an incoming internal webhook request is authorized:
    1. Valid QStash signature (via Receiver) if QSTASH_CURRENT_SIGNING_KEY is set
    2. Valid X-Internal-Secret header (matching INTERNAL_CRON_SECRET or SECRET_KEY)
    3. Development fallback when keys are unset
    """
    # 1. Direct Secret Header Check
    internal_header = request.headers.get("x-internal-secret") or request.headers.get("X-Internal-Secret")
    expected_secret = settings.INTERNAL_CRON_SECRET or settings.SECRET_KEY
    if internal_header and expected_secret and internal_header.strip() == expected_secret.strip():
        return True

    # 2. QStash JWT Signature Verification
    signing_key = settings.QSTASH_CURRENT_SIGNING_KEY or os.getenv("QSTASH_CURRENT_SIGNING_KEY", "").strip()
    next_signing_key = (
        getattr(settings, "QSTASH_NEXT_SIGNING_KEY", "")
        or os.getenv("QSTASH_NEXT_SIGNING_KEY", "").strip()
        or signing_key
    )
    signature = request.headers.get("upstash-signature")
    if signing_key and signature:
        try:
            from qstash import Receiver
            receiver = Receiver(current_signing_key=signing_key, next_signing_key=next_signing_key)
            body_str = raw_body.decode("utf-8", errors="replace")
            try:
                receiver.verify(
                    signature=signature,
                    body=body_str,
                    url=str(request.url),
                )
                return True
            except Exception:
                # Handle reverse proxy / SSL termination (e.g. x-forwarded-proto: https)
                proto = request.headers.get("x-forwarded-proto") or request.url.scheme
                host = request.headers.get("x-forwarded-host") or request.headers.get("host") or request.url.netloc
                reconstructed_url = f"{proto}://{host}{request.url.path}"
                receiver.verify(
                    signature=signature,
                    body=body_str,
                    url=reconstructed_url,
                )
                return True
        except Exception as err:
            print(f"[Upstash QStash] Signature verification failed: {err}")
            return False

    # 3. Allow in development if no security secret configured
    if settings.ENVIRONMENT == "development" and not signing_key and not settings.INTERNAL_CRON_SECRET:
        return True

    return False
