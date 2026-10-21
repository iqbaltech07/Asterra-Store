import time
import hashlib
import json
from typing import Any, Optional, Dict, Tuple, Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from app.core.redis_client import get_redis_client

class SmartCache:
    """
    Hybrid high-performance cache:
    - Primary: Upstash Serverless Redis (distributed across instances, sub-millisecond, persistent)
    - Secondary/Fallback: In-memory Python dict with TTL and namespace versioning
    Supports ETag generation, HTTP 304 Not Modified, and atomic namespace invalidation.
    """
    _store: Dict[str, Tuple[float, Any]] = {}  # key -> (expires_at, value)
    _versions: Dict[str, int] = {}  # namespace -> version integer
    _tags: Dict[str, str] = {}  # namespace -> etag string

    @classmethod
    def get_version(cls, namespace: str) -> int:
        redis = get_redis_client()
        if redis is not None:
            try:
                val = redis.get(f"ver:{namespace}")
                if val is not None:
                    return int(val)
                # Initialize if not set
                redis.set(f"ver:{namespace}", 1)
                return 1
            except Exception:
                pass

        if namespace not in cls._versions:
            cls._versions[namespace] = 1
        return cls._versions[namespace]

    @classmethod
    def invalidate(cls, *namespaces: str) -> None:
        """
        Atomically bumps namespace versions across Redis and local memory.
        Instantly invalidates all keys under the namespaces with O(1) complexity.
        """
        redis = get_redis_client()
        for namespace in namespaces:
            # 1. Redis atomic increment
            if redis is not None:
                try:
                    redis.incr(f"ver:{namespace}")
                except Exception as e:
                    print(f"[SmartCache] Redis invalidation note: {e}")

            # 2. Local memory update
            cls._versions[namespace] = cls._versions.get(namespace, 1) + 1
            prefix = f"{namespace}:"
            stale_keys = [k for k in cls._store if k.startswith(prefix)]
            for k in stale_keys:
                cls._store.pop(k, None)

    @classmethod
    def get(cls, namespace: str, key: str) -> Optional[Any]:
        ver = cls.get_version(namespace)
        full_key = f"{namespace}:{ver}:{key}"

        # 1. Try Upstash Redis first
        redis = get_redis_client()
        if redis is not None:
            try:
                raw = redis.get(full_key)
                if raw is not None:
                    if isinstance(raw, (dict, list)):
                        return raw
                    try:
                        return json.loads(raw)
                    except Exception:
                        return raw
            except Exception:
                pass

        # 2. Fallback to in-memory store
        entry = cls._store.get(full_key)
        if not entry:
            return None
        expires_at, val = entry
        if time.time() > expires_at:
            cls._store.pop(full_key, None)
            return None
        return val

    @classmethod
    def set(cls, namespace: str, key: str, value: Any, ttl: int = 60) -> None:
        ver = cls.get_version(namespace)
        full_key = f"{namespace}:{ver}:{key}"

        # 1. Store in Upstash Redis
        redis = get_redis_client()
        if redis is not None:
            try:
                serialized = json.dumps(value, default=str)
                redis.set(full_key, serialized, ex=ttl)
            except Exception as e:
                print(f"[SmartCache] Redis set error (falling back to memory): {e}")

        # 2. Always store in local memory as secondary cache
        if len(cls._store) > 2000:
            now = time.time()
            expired = [k for k, (exp, _) in cls._store.items() if now > exp]
            for k in expired:
                cls._store.pop(k, None)
        cls._store[full_key] = (time.time() + ttl, value)

    @classmethod
    def generate_etag(cls, namespace: str, extra: str = "", content: Optional[Any] = None) -> str:
        version = cls.get_version(namespace)
        content_hash = ""
        if content is not None:
            try:
                s = json.dumps(content, sort_keys=True, default=str)
                content_hash = hashlib.md5(s.encode("utf-8")).hexdigest()[:8]
            except Exception:
                pass
        raw = f"{namespace}-v{version}-{extra}-{content_hash}"
        digest = hashlib.md5(raw.encode("utf-8")).hexdigest()[:12]
        return f'W/"{namespace}-{digest}"'

    @classmethod
    def is_not_modified(cls, request: Request, etag: str) -> bool:
        if_none_match = request.headers.get("if-none-match")
        if not if_none_match:
            return False
        incoming_tags = [t.strip() for t in if_none_match.split(",")]
        clean_etag = etag.strip().removeprefix("W/")
        for incoming in incoming_tags:
            clean_incoming = incoming.removeprefix("W/").strip('"')
            if clean_incoming == clean_etag.strip('"') or incoming == "*":
                return True
        return False

    @classmethod
    def not_modified_response(cls, etag: str, max_age: int = 0) -> Response:
        res = Response(status_code=304)
        res.headers["ETag"] = etag
        if max_age == 0:
            res.headers["Cache-Control"] = "no-cache, must-revalidate"
        else:
            res.headers["Cache-Control"] = f"public, max-age={max_age}, stale-while-revalidate={max_age * 2}"
        return res

    @classmethod
    def apply_headers(
        cls,
        response: Response,
        etag: Optional[str] = None,
        max_age: int = 60,
        is_private: bool = False,
        mode: str = "standard",
    ) -> None:
        if mode == "revalidate" or max_age == 0:
            response.headers["Cache-Control"] = "no-cache, must-revalidate"
        else:
            cache_type = "private" if is_private else "public"
            response.headers["Cache-Control"] = (
                f"{cache_type}, max-age={max_age}, s-maxage={max_age * 2}, stale-while-revalidate={max_age * 4}"
            )
        if etag:
            response.headers["ETag"] = etag

cache = SmartCache
