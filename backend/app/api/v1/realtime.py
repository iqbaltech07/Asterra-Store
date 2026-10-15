import asyncio
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse

router = APIRouter()

async def event_generator(request: Request):
    """
    Server-Sent Events generator with graceful disconnection detection
    to prevent memory and coroutine leaks on serverless or long-lived runtimes.
    """
    yield f"data: {json.dumps({'type': 'connected', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
    try:
        while True:
            # Check client disconnection before and after sleeping
            if await request.is_disconnected():
                break
            await asyncio.sleep(15)
            if await request.is_disconnected():
                break
            yield f"data: {json.dumps({'type': 'ping', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
    except (asyncio.CancelledError, GeneratorExit):
        pass

@router.options("/events", tags=["Realtime"])
async def sse_options(request: Request):
    origin = request.headers.get("origin") or "*"
    return Response(
        status_code=204,
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )

@router.get("/events", tags=["Realtime"])
async def sse_events(request: Request, role: Optional[str] = "user"):
    origin = request.headers.get("origin") or "*"
    headers = {
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Content-Type": "text/event-stream",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "*",
    }
    return StreamingResponse(event_generator(request), media_type="text/event-stream", headers=headers)
