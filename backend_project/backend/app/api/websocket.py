from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import ws_manager
from app.utils.logger import get_logger

logger = get_logger("api.websocket")
router = APIRouter(tags=["Real-Time WebSockets"])


@router.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint broadcasting live telemetry, anomalies, predictions,
    decisions, and human-in-the-loop review alerts to connected dashboards.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, receive any client pings or filters
            data = await websocket.receive_text()
            logger.debug(f"Received client message on WS: {data}")
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        await ws_manager.disconnect(websocket)
