import os
from typing import Optional
from app.config import settings

_redis_instance = None
_redis_initialized = False

def get_redis_client():
    """
    Returns a singleton Upstash Redis client.
    If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not configured,
    returns None gracefully (enabling seamless fallback to in-memory cache).
    """
    global _redis_instance, _redis_initialized
    if _redis_initialized:
        return _redis_instance

    url = settings.UPSTASH_REDIS_REST_URL or os.getenv("UPSTASH_REDIS_REST_URL", "").strip()
    token = settings.UPSTASH_REDIS_REST_TOKEN or os.getenv("UPSTASH_REDIS_REST_TOKEN", "").strip()

    if url and token:
        try:
            from upstash_redis import Redis
            _redis_instance = Redis(url=url, token=token)
            # Lightweight healthcheck
            _redis_instance.ping()
            print("[Upstash Redis] Connected successfully to serverless cache.")
        except Exception as e:
            print(f"[Upstash Redis] Connection warning (falling back to memory): {e}")
            _redis_instance = None
    else:
        # Graceful development mode
        _redis_instance = None

    _redis_initialized = True
    return _redis_instance
