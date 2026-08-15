import json
import asyncio
from typing import List, Dict, Any
from fastapi import WebSocket
from datetime import datetime, timezone
from app.utils.logger import get_logger

logger = get_logger("services.websocket")


class WebSocketManager:
    """
    Manages active WebSocket client connections and broadcasts real-time system events.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        """
        Broadcast structured JSON event to all connected dashboard clients.
        """
        if not self.active_connections:
            return

        message = {
            "event_type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": data
        }
        
        # Serialize datetime objects
        payload_str = json.dumps(message, default=str)
        
        dead_connections = []
        async with self._lock:
            for connection in self.active_connections:
                try:
                    await connection.send_text(payload_str)
                except Exception as e:
                    logger.warning(f"Error sending message to WebSocket client: {e}")
                    dead_connections.append(connection)
            
            for dead in dead_connections:
                if dead in self.active_connections:
                    self.active_connections.remove(dead)


# Global singleton instance
ws_manager = WebSocketManager()
