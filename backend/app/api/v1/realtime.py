import asyncio
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Request, Response
from fastapi.responses import StreamingResponse
from app.services.realtime_broadcaster import RealtimeBroadcaster

router = APIRouter()

async def event_generator(request: Request, role: str = "user"):
    """
    Server-Sent Events generator with graceful disconnection detection
    connected to RealtimeBroadcaster for instant order & payment notifications.
    """
    queue = RealtimeBroadcaster.subscribe(role=role)
    # Send initial connection confirmation
    yield f"event: connected\ndata: {json.dumps({'type': 'connected', 'role': role, 'timestamp': datetime.utcnow().isoformat() + 'Z'})}\n\n"

    try:
        while True:
            if await request.is_disconnected():
                break

            try:
                # Wait for up to 15 seconds for a broadcasted event
                message = await asyncio.wait_for(queue.get(), timeout=15.0)
                yield message
            except asyncio.TimeoutError:
                # Heartbeat keep-alive ping to prevent proxy/browser timeout
                if await request.is_disconnected():
                    break
                ping_payload = json.dumps({"type": "ping", "timestamp": datetime.utcnow().isoformat() + "Z"})
                yield f"event: ping\ndata: {ping_payload}\n\n"
    except (asyncio.CancelledError, GeneratorExit):
        pass
    finally:
        RealtimeBroadcaster.unsubscribe(queue)

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
    target_role = (role or "user").lower().strip()
    return StreamingResponse(
        event_generator(request, role=target_role),
        media_type="text/event-stream",
        headers=headers,
    )
