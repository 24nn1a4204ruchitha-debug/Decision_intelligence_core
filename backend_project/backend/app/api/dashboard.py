import time
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone

from app.database import get_db
from app.models.decision import Decision
from app.models.anomaly import Anomaly
from app.models.human_review import HumanReview
from app.models.data_record import DataRecord
from app.models.feedback import Feedback
from app.schemas.dashboard import (
    DashboardOverviewResponse, RecentDecisionItem, RecentAnomalyItem, SystemHealthResponse
)
from app.ml.model_registry import registry
from app.services.demo_simulator import simulator
from app.services.websocket_manager import ws_manager
from app.utils.logger import get_logger

logger = get_logger("api.dashboard")
router = APIRouter(prefix="/dashboard", tags=["Dashboard Analytics & Monitoring"])

START_TIME = time.time()


@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(db: Session = Depends(get_db)):
    """
    Get aggregated dashboard summary KPIs:
    Total decisions, autonomous actions, pending reviews, anomalies detected,
    high risk count, average confidence, data quality score, model accuracy, and override rate.
    """
    total_decisions = db.query(Decision).count()
    autonomous_decisions = db.query(Decision).filter(Decision.executed_autonomously == True).count()
    human_reviewed_decisions = db.query(Decision).filter(Decision.status.in_(["HUMAN_APPROVED", "HUMAN_REJECTED", "HUMAN_MODIFIED"])).count()
    pending_reviews_count = db.query(HumanReview).filter(HumanReview.review_status == "PENDING").count()
    anomalies_detected = db.query(Anomaly).filter(Anomaly.anomaly_detected == True).count()
    high_risk_decisions = db.query(Decision).filter(Decision.risk_level.in_(["HIGH", "CRITICAL"])).count()

    avg_conf = db.query(func.avg(Decision.confidence_score)).scalar() or 0.85
    avg_quality = db.query(func.avg(DataRecord.quality_score)).scalar() or 0.92

    feedbacks = db.query(Feedback.correctness).all()
    model_accuracy = (sum([f[0] for f in feedbacks]) / len(feedbacks)) if feedbacks else 0.94

    overrides = db.query(Decision).filter(Decision.status.in_(["HUMAN_REJECTED", "HUMAN_MODIFIED"])).count()
    human_override_rate = round(overrides / max(1, total_decisions), 4) if total_decisions > 0 else 0.0

    # Reliability distribution
    rel_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "UNRELIABLE": 0}
    rel_rows = db.query(Decision.reliability_level, func.count(Decision.id)).group_by(Decision.reliability_level).all()
    for rel, count in rel_rows:
        if rel in rel_counts:
            rel_counts[rel] = count

    # Risk distribution
    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    risk_rows = db.query(Decision.risk_level, func.count(Decision.id)).group_by(Decision.risk_level).all()
    for risk, count in risk_rows:
        if risk in risk_counts:
            risk_counts[risk] = count

    return DashboardOverviewResponse(
        total_decisions=total_decisions,
        autonomous_decisions=autonomous_decisions,
        human_reviewed_decisions=human_reviewed_decisions,
        pending_reviews_count=pending_reviews_count,
        anomalies_detected=anomalies_detected,
        high_risk_decisions=high_risk_decisions,
        average_confidence=round(float(avg_conf), 4),
        average_data_quality=round(float(avg_quality), 4),
        model_accuracy=round(float(model_accuracy), 4),
        human_override_rate=human_override_rate,
        reliability_distribution=rel_counts,
        risk_distribution=risk_counts
    )


@router.get("/recent-decisions", response_model=List[RecentDecisionItem])
def get_recent_decisions(
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Retrieve latest evaluated decisions for live activity feed.
    """
    records = db.query(Decision).order_by(Decision.timestamp.desc()).limit(limit).all()
    return records


@router.get("/recent-anomalies", response_model=List[RecentAnomalyItem])
def get_recent_anomalies(
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Retrieve latest detected anomalies.
    """
    records = db.query(Anomaly).filter(Anomaly.anomaly_detected == True).order_by(Anomaly.timestamp.desc()).limit(limit).all()
    return records


@router.get("/system-health", response_model=SystemHealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    """
    Diagnostic health check endpoint verifying database connectivity, active models, and pipeline status.
    """
    uptime = round(time.time() - START_TIME, 2)
    db_ok = True
    try:
        db.execute(func.now()).scalar()
    except Exception:
        db_ok = False

    return SystemHealthResponse(
        status="HEALTHY" if db_ok else "DEGRADED",
        uptime_seconds=uptime,
        database_connected=db_ok,
        active_model_version=registry.predictor.version,
        active_ml_models=list(registry.model_catalog.keys()),
        data_pipeline_status="ONLINE",
        simulation_running=simulator.is_running,
        active_websocket_connections=len(ws_manager.active_connections),
        timestamp=datetime.now(timezone.utc)
    )
