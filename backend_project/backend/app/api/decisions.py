from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.decision import Decision
from app.schemas.decision import DecisionEvaluateRequest, DecisionResponse
from app.services.decision_engine import DecisionEngine
from app.utils.logger import get_logger

logger = get_logger("api.decisions")
router = APIRouter(prefix="/decision", tags=["Central Decision Engine"])


@router.post("/evaluate", response_model=DecisionResponse, status_code=status.HTTP_200_OK)
def evaluate_decision_endpoint(req: DecisionEvaluateRequest, db: Session = Depends(get_db)):
    """
    Run full Decision Intelligence pipeline on incoming data:
    Predicts state, detects anomalies, quantifies uncertainty, applies safety guardrails,
    generates 6-point explainable AI reasoning, records audit trail, and routes to autonomous action or human review.
    """
    result = DecisionEngine.evaluate(
        db=db,
        data=req.data,
        data_record_id=req.data_record_id,
        context=req.context,
        risk_tolerance=req.risk_tolerance or "STANDARD",
        force_human_review=req.force_human_review or False
    )
    return result


@router.get("s", response_model=List[DecisionResponse])
def list_decisions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    risk_level: Optional[str] = Query(None, description="Filter by risk level: LOW, MEDIUM, HIGH, CRITICAL"),
    status_filter: Optional[str] = Query(None, description="Filter by status: EXECUTED, PENDING_REVIEW, HUMAN_APPROVED, HUMAN_REJECTED"),
    requires_review: Optional[bool] = Query(None, description="Filter by human review requirement"),
    db: Session = Depends(get_db)
):
    """
    Query historical decisions with multi-attribute filtering.
    """
    query = db.query(Decision)
    if risk_level:
        query = query.filter(Decision.risk_level == risk_level)
    if status_filter:
        query = query.filter(Decision.status == status_filter)
    if requires_review is not None:
        query = query.filter(Decision.requires_human_review == requires_review)
    
    records = query.order_by(Decision.timestamp.desc()).offset(offset).limit(limit).all()
    return [
        DecisionResponse(
            decision_id=d.id,
            decision=d.decision,
            recommended_action=d.recommended_action,
            risk_level=d.risk_level,
            confidence_score=d.confidence_score,
            uncertainty_score=d.uncertainty_score,
            reliability=d.reliability_level,
            requires_human_review=d.requires_human_review,
            executed_autonomously=d.executed_autonomously,
            status=d.status,
            explanation=d.explanation or [],
            nl_explanation=d.nl_explanation,
            reasons=d.reasons or [],
            timestamp=d.timestamp
        )
        for d in records
    ]


@router.get("s/{decision_id}", response_model=DecisionResponse)
def get_decision_by_id(decision_id: str, db: Session = Depends(get_db)):
    """
    Retrieve single decision report with full explanation breakdown.
    """
    d = db.query(Decision).filter(Decision.id == decision_id).first()
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Decision '{decision_id}' not found")
    
    return DecisionResponse(
        decision_id=d.id,
        decision=d.decision,
        recommended_action=d.recommended_action,
        risk_level=d.risk_level,
        confidence_score=d.confidence_score,
        uncertainty_score=d.uncertainty_score,
        reliability=d.reliability_level,
        requires_human_review=d.requires_human_review,
        executed_autonomously=d.executed_autonomously,
        status=d.status,
        explanation=d.explanation or [],
        nl_explanation=d.nl_explanation,
        reasons=d.reasons or [],
        timestamp=d.timestamp
    )
