import hashlib
import json
from typing import Dict, Tuple

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.config import settings
from app.core.redis_client import get_redis_client

router = APIRouter(prefix="/media", tags=["Media"])

# High-performance in-memory cache to avoid outbound roundtrips on repeated hits
_MEDIA_CACHE: Dict[str, Tuple[bytes, str, str]] = {}  # key -> (content, media_type, etag)


@router.get("/brand-icons/{brand_name}")
async def get_brand_icon(brand_name: str):
    """
    Serve a brand icon securely from Vercel Blob Storage using Upstash Redis metadata.
    Supports requests with or without extension (e.g. 'canva.webp' or 'canva').
    """
    if not brand_name:
        raise HTTPException(status_code=400, detail="Brand name is required")

    clean_name = brand_name.lower().strip()
    key_name = clean_name.rsplit(".", 1)[0] if "." in clean_name else clean_name

    # Validate sanitized key contains only alphanumeric, hyphen, underscore
    if not key_name or not key_name.replace("-", "").replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid brand name format")

    # 1. Fast-path: Check in-memory cache
    if key_name in _MEDIA_CACHE:
        content, media_type, etag = _MEDIA_CACHE[key_name]
        return Response(
            content=content,
            media_type=media_type,
            headers={
                "Cache-Control": "public, max-age=31536000, immutable",
                "ETag": etag,
            },
        )

    # 2. Lookup Upstash Redis metadata
    redis = get_redis_client()
    if redis is None:
        raise HTTPException(status_code=503, detail="Upstash cache service is not configured")

    raw = redis.get(f"brand-icons:{key_name}")
    if not raw:
        raw = redis.get(f"brand-icons:{clean_name}")
    if not raw:
        raise HTTPException(status_code=404, detail="Brand icon not found")

    item = json.loads(raw) if isinstance(raw, str) else raw
    blob_url = item.get("url")
    if not blob_url or not settings.BLOB_READ_WRITE_TOKEN:
        raise HTTPException(status_code=503, detail="Blob storage is not configured")

    # 3. Fetch from private Vercel Blob with token
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            blob_url,
            headers={
                "Authorization": f"Bearer {settings.BLOB_READ_WRITE_TOKEN}",
                "Cache-Control": "no-cache",
            },
        )
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to retrieve brand icon from storage")

    content = response.content
    media_type = item.get("content_type", "application/octet-stream")
    etag = f'"{hashlib.md5(content).hexdigest()}"'

    # Populate in-memory cache
    _MEDIA_CACHE[key_name] = (content, media_type, etag)

    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": etag,
        },
    )
