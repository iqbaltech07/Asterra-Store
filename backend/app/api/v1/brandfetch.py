import os
import json
import pathlib
import urllib.parse
from typing import Optional, List, Dict, Any
from datetime import datetime

import httpx
from fastapi import APIRouter, Query, HTTPException, Request

from app.config import settings

router = APIRouter(prefix="/brands", tags=["Brandfetch"])

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
CACHE_FILE = DATA_DIR / "brand-logos-cache.json"

# In-memory LRU-like dictionary cache
_MEMORY_CACHE: Dict[str, Any] = {}

def _load_disk_cache() -> Dict[str, Any]:
    global _MEMORY_CACHE
    if _MEMORY_CACHE:
        return _MEMORY_CACHE
    try:
        if CACHE_FILE.exists():
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                _MEMORY_CACHE = json.load(f)
        else:
            _MEMORY_CACHE = {}
    except Exception as e:
        print(f"[Brandfetch] Failed to load disk cache: {e}")
        _MEMORY_CACHE = {}
    return _MEMORY_CACHE

def _save_to_disk_cache(key: str, data: Dict[str, Any]):
    global _MEMORY_CACHE
    _MEMORY_CACHE[key.lower().strip()] = data
    try:
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(_MEMORY_CACHE, f, indent=2)
    except Exception as e:
        print(f"[Brandfetch] Failed to save disk cache: {e}")

@router.get("/search")
async def search_brands(q: str = Query(..., min_length=1, description="Brand name or domain to search")):
    query_clean = q.strip().lower()
    if not query_clean:
        return {"success": True, "data": []}

    cache_data = _load_disk_cache()

    # 1. Check exact key in local cache first
    exact_match = cache_data.get(query_clean)
    if exact_match and isinstance(exact_match, dict) and exact_match.get("icon"):
        # Still attempt search or return cached as first item
        pass

    # 2. Call Brandfetch API
    client_id = settings.BRANDFETCH_CLIENT_ID or os.getenv("BRANDFETCH_CLIENT_ID", "1idOZh3WAwyNTiUHkB7")
    api_key = settings.BRANDFETCH_API_KEY or os.getenv("BRANDFETCH_API_KEY", "")

    url = f"https://api.brandfetch.io/v2/search/{urllib.parse.quote(query_clean)}?c={client_id}"
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    results: List[Dict[str, Any]] = []

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                items = resp.json()
                if isinstance(items, list):
                    for item in items:
                        icon_url = item.get("icon")
                        domain = item.get("domain", "")
                        name = item.get("name") or domain
                        brand_id = item.get("brandId", "")

                        # Fallback CDN URL if icon not returned
                        if not icon_url and domain:
                            icon_url = f"https://cdn.brandfetch.io/domain/{domain}?c={client_id}"

                        brand_entry = {
                            "name": name,
                            "domain": domain,
                            "icon": icon_url,
                            "brandId": brand_id,
                            "claimed": item.get("claimed", False),
                            "verified": item.get("verified", False),
                            "score": item.get("_score", 0),
                        }
                        results.append(brand_entry)

                        # Auto-cache top match
                        if domain and icon_url:
                            _save_to_disk_cache(name.lower(), brand_entry)
                            _save_to_disk_cache(domain.lower(), brand_entry)
            else:
                print(f"[Brandfetch] API returned status {resp.status_code}: {resp.text[:200]}")
    except Exception as exc:
        print(f"[Brandfetch] Request failed for query '{q}': {exc}")

    # 3. Fallback to local cache matching if API returned 0 results or failed
    if not results and cache_data:
        matched_cached = []
        for key, val in cache_data.items():
            if query_clean in key or (isinstance(val, dict) and query_clean in val.get("name", "").lower()):
                matched_cached.append(val)
        if matched_cached:
            results = matched_cached[:10]

    return {
        "success": True,
        "query": q,
        "total": len(results),
        "data": results,
    }

@router.get("/cache")
def get_cached_brands():
    """Returns all currently cached brand logos to avoid repetitive calls."""
    cache_data = _load_disk_cache()
    return {
        "success": True,
        "total": len(cache_data),
        "data": cache_data,
    }
