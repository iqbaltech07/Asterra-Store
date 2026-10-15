import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, Response
from fastapi.responses import JSONResponse

class InMemoryRateLimiter:
    """
    Sliding window rate limiter per client IP address.
    Self-cleaning to prevent memory bloat.
    """
    def __init__(self):
        # ip -> list of request timestamps
        self._auth_limits: Dict[str, List[float]] = defaultdict(list)
        self._action_limits: Dict[str, List[float]] = defaultdict(list)
        self._general_limits: Dict[str, List[float]] = defaultdict(list)
        self._last_clean = time.time()

    def _cleanup_old_records(self, now: float):
        if now - self._last_clean < 60:
            return
        self._last_clean = now
        window = 60.0
        for d in (self._auth_limits, self._action_limits, self._general_limits):
            empty_keys = []
            for ip, timestamps in d.items():
                d[ip] = [t for t in timestamps if now - t < window]
                if not d[ip]:
                    empty_keys.append(ip)
            for k in empty_keys:
                d.pop(k, None)

    def is_allowed(self, ip: str, path: str, method: str) -> Tuple[bool, int]:
        """
        Returns (is_allowed, retry_after_seconds)
        """
        now = time.time()
        self._cleanup_old_records(now)

        window = 60.0

        # 1. Auth Login Rate Limit (12 req / min)
        if "/auth/login" in path:
            records = [t for t in self._auth_limits[ip] if now - t < window]
            if len(records) >= 12:
                retry_after = int(window - (now - records[0])) + 1
                return False, max(1, retry_after)
            records.append(now)
            self._auth_limits[ip] = records
            return True, 0

        # 2. Sensitive Action Endpoints: Validate Promo & Create/Pay Order (30 req / min)
        if method == "POST" and (
            "/promos/validate" in path or "/orders" in path or "/affiliate/register" in path
        ):
            records = [t for t in self._action_limits[ip] if now - t < window]
            if len(records) >= 30:
                retry_after = int(window - (now - records[0])) + 1
                return False, max(1, retry_after)
            records.append(now)
            self._action_limits[ip] = records
            return True, 0

        # 3. General Endpoints Limit (300 req / min)
        records = [t for t in self._general_limits[ip] if now - t < window]
        if len(records) >= 300:
            retry_after = int(window - (now - records[0])) + 1
            return False, max(1, retry_after)
        records.append(now)
        self._general_limits[ip] = records
        return True, 0

rate_limiter = InMemoryRateLimiter()

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

async def security_and_rate_limit_middleware(request: Request, call_next):
    client_ip = get_client_ip(request)
    path = request.url.path
    method = request.method

    # Skip rate limiting for static docs and health checks
    is_exempt = path in ["/health", "/docs", "/openapi.json", "/redoc"] or path.startswith("/media/")
    if not is_exempt:
        allowed, retry_after = rate_limiter.is_allowed(client_ip, path, method)
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {
                        "code": "TOO_MANY_REQUESTS",
                        "message": f"Terlalu banyak permintaan dari alamat IP Anda. Silakan coba lagi dalam {retry_after} detik.",
                    },
                },
                headers={"Retry-After": str(retry_after)},
            )

    response: Response = await call_next(request)

    # Attach Enterprise Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

    return response
