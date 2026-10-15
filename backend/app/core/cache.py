import time
import hashlib
import json
from typing import Any, Optional, Dict, Tuple, Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse

class SmartCache:
    """
    In-memory high performance TTL, LRU-style cache with namespace versioning,
    ETag generation, and HTTP 304 Not Modified support.
    """
    _store: Dict[str, Tuple[float, Any]] = {}  # key -> (expires_at, value)
    _versions: Dict[str, int] = {}  # namespace -> version integer
    _tags: Dict[str, str] = {}  # namespace -> etag string

    @classmethod
    def get_version(cls, namespace: str) -> int:
        if namespace not in cls._versions:
            cls._versions[namespace] = 1
        return cls._versions[namespace]

    @classmethod
    def invalidate(cls, *namespaces: str) -> None:
        """Bumps namespace versions and invalidates all keys under them."""
        for namespace in namespaces:
            cls._versions[namespace] = cls.get_version(namespace) + 1
            # Clear matching prefix keys
            prefix = f"{namespace}:"
            stale_keys = [k for k in cls._store if k.startswith(prefix)]
            for k in stale_keys:
                cls._store.pop(k, None)

    @classmethod
    def get(cls, namespace: str, key: str) -> Optional[Any]:
        full_key = f"{namespace}:{cls.get_version(namespace)}:{key}"
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
        full_key = f"{namespace}:{cls.get_version(namespace)}:{key}"
        # Soft cleanup if store grows beyond 2000 entries
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
        # Handle multiple tags or weak prefix
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
