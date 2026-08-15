from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse
from app.utils.logger import get_logger

logger = get_logger("api.audit")
router = APIRouter(prefix="/audit", tags=["Decision Audit Trail"])


@router.get("/logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    actor: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    human_only: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Query system-wide immutable audit trail logs.
    """
    query = db.query(AuditLog)
    if actor:
        query = query.filter(AuditLog.actor == actor)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    if human_only is not None:
        query = query.filter(AuditLog.human_intervention == human_only)

    logs = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    return logs


@router.get("/{decision_id}", response_model=List[AuditLogResponse])
def get_decision_audit_trail(decision_id: str, db: Session = Depends(get_db)):
    """
    Retrieve complete chronological lifecycle audit history for a specific decision.
    """
    logs = db.query(AuditLog).filter(AuditLog.decision_id == decision_id).order_by(AuditLog.timestamp.asc()).all()
    if not logs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No audit records found for decision ID '{decision_id}'"
        )
    return logs
