import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Set, Any, Optional

logger = logging.getLogger("realtime_broadcaster")

class RealtimeBroadcaster:
    """
    High-performance in-memory pub/sub event broadcaster for Server-Sent Events (SSE).
    Supports concurrent role-based broadcasting (admin, user, all), non-blocking
    queue dispatches, bounded queues to prevent memory backpressure, and thread-safety.
    """
    _subscribers: Set[asyncio.Queue] = set()
    _role_map: Dict[asyncio.Queue, str] = {}
    _loop: Optional[asyncio.AbstractEventLoop] = None

    @classmethod
    def set_loop(cls, loop: asyncio.AbstractEventLoop) -> None:
        """Explicitly registers the running asyncio event loop (e.g. from FastAPI lifespan)."""
        cls._loop = loop

    @classmethod
    def _get_loop(cls) -> Optional[asyncio.AbstractEventLoop]:
        if cls._loop and not cls._loop.is_closed():
            return cls._loop
        try:
            return asyncio.get_running_loop()
        except RuntimeError:
            return None

    @classmethod
    def subscribe(cls, role: str = "all", maxsize: int = 50) -> asyncio.Queue:
        """
        Subscribes a client connection queue to receive SSE events.
        """
        loop = cls._get_loop()
        if loop and not cls._loop:
            cls._loop = loop

        q: asyncio.Queue = asyncio.Queue(maxsize=maxsize)
        cls._subscribers.add(q)
        cls._role_map[q] = role.lower().strip()
        logger.info(f"[RealtimeBroadcaster] Subscriber joined (role={role}, total={len(cls._subscribers)})")
        return q

    @classmethod
    def unsubscribe(cls, q: asyncio.Queue) -> None:
        """
        Removes a disconnected client queue and releases resources.
        """
        cls._subscribers.discard(q)
        cls._role_map.pop(q, None)
        logger.info(f"[RealtimeBroadcaster] Subscriber disconnected (remaining={len(cls._subscribers)})")

    @classmethod
    def broadcast(cls, event: str, data: Any, target_role: str = "all") -> None:
        """
        Broadcasts an SSE event to all eligible connected clients.
        Thread-safe and async-safe: can be called from sync services or async coroutines.
        """
        if not cls._subscribers:
            return

        raw_message = f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"
        target_role = target_role.lower().strip()
        loop = cls._get_loop()

        def _dispatch():
            dead_queues = []
            for q in list(cls._subscribers):
                q_role = cls._role_map.get(q, "all")
                # Check role compatibility (admin receives 'admin' and 'all', etc.)
                if target_role != "all" and q_role != "all" and q_role != target_role:
                    continue

                try:
                    if q.full():
                        # Drop oldest message to prevent backpressure blocking
                        try:
                            q.get_nowait()
                        except asyncio.QueueEmpty:
                            pass
                    q.put_nowait(raw_message)
                except Exception as ex:
                    logger.warning(f"[RealtimeBroadcaster] Failed to dispatch event to queue: {ex}")
                    dead_queues.append(q)

            for dead_q in dead_queues:
                cls.unsubscribe(dead_q)

        if loop and loop.is_running():
            try:
                # If currently executing inside the running loop thread
                current_loop = asyncio.get_running_loop()
                if current_loop == loop:
                    _dispatch()
                else:
                    loop.call_soon_threadsafe(_dispatch)
            except RuntimeError:
                loop.call_soon_threadsafe(_dispatch)
        else:
            # If no loop is active yet, cannot dispatch to async queues
            pass
