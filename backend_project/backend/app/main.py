import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db, SessionLocal
from app.api import api_router, websocket_router
from app.models.user import User
from app.utils.security import get_password_hash
from app.ml.model_registry import registry
from app.services.demo_simulator import simulator
from app.utils.logger import get_logger

logger = get_logger("main")


def seed_initial_admin(db):
    """Seed initial system administrator account if database is empty."""
    admin_exists = db.query(User).filter(User.username == "admin").first()
    if not admin_exists:
        admin_user = User(
            email="admin@decision.ai",
            username="admin",
            full_name="Master Administrator",
            hashed_password=get_password_hash("adminpassword123"),
            role="ADMIN",
            is_active=True
        )
        reviewer_user = User(
            email="reviewer@decision.ai",
            username="reviewer",
            full_name="Safety Review Officer",
            hashed_password=get_password_hash("reviewerpassword123"),
            role="HUMAN_REVIEWER",
            is_active=True
        )
        db.add(admin_user)
        db.add(reviewer_user)
        db.commit()
        logger.info("Default administrator (admin) and reviewer (reviewer) accounts seeded.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown event lifecycle manager.
    """
    logger.info(f"Initializing {settings.APP_NAME}...")
    # Initialize DB Tables
    init_db()
    
    # Seed default credentials
    db = SessionLocal()
    try:
        seed_initial_admin(db)
    finally:
        db.close()

    # Pre-warm ML Models
    _ = registry.predictor
    _ = registry.anomaly_detector
    _ = registry.confidence_estimator
    logger.info("Machine Learning models and registries loaded.")

    if settings.SIMULATION_AUTO_START:
        simulator.start(interval_seconds=settings.SIMULATION_INTERVAL_SECONDS)
        logger.info("Demo Simulator auto-started.")

    yield

    # Shutdown
    if simulator.is_running:
        simulator.stop()
    logger.info(f"Shutting down {settings.APP_NAME}.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Production-grade AI Decision Intelligence Backend for complex, uncertain, and rapidly changing environments.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Custom Exception Handler for Standard Error Responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "An internal server error occurred.",
            "details": str(exc) if settings.DEBUG else {}
        }
    )


# Mount Static Uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(websocket_router)


@app.get("/", tags=["System"])
def root():
    """
    Root system status and welcome endpoint.
    """
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "status": "ONLINE",
        "documentation": "/docs",
        "redoc": "/redoc",
        "api_v1": settings.API_V1_STR,
        "websocket_events": "/ws/events",
        "active_model": registry.predictor.version
    }


@app.get("/api/healthz", tags=["System"])
@app.get("/healthz", tags=["System"])
def healthz():
    """
    Health check endpoint for frontend connection probes.
    """
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "active_model": registry.predictor.version
    }
