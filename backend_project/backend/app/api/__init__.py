from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.ingestion import router as ingestion_router
from app.api.predictions import router as predictions_router
from app.api.anomalies import router as anomalies_router
from app.api.decisions import router as decisions_router
from app.api.reviews import router as reviews_router
from app.api.feedback import router as feedback_router
from app.api.dashboard import router as dashboard_router
from app.api.audit import router as audit_router
from app.api.demo import router as demo_router
from app.api.websocket import router as websocket_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(ingestion_router)
api_router.include_router(predictions_router)
api_router.include_router(anomalies_router)
api_router.include_router(decisions_router)
api_router.include_router(reviews_router)
api_router.include_router(feedback_router)
api_router.include_router(dashboard_router)
api_router.include_router(audit_router)
api_router.include_router(demo_router)

__all__ = ["api_router", "websocket_router"]
