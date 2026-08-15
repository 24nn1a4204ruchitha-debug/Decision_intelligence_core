from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse, ModelPerformanceResponse, RetrainResponse
from app.services.adaptation_service import AdaptationService
from app.utils.security import get_current_user, require_roles
from app.utils.logger import get_logger

logger = get_logger("api.feedback")
router = APIRouter(tags=["Adaptive Learning & Feedback"])


@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    fb_in: FeedbackCreate,
    db: Session = Depends(get_db)
):
    """
    Ingest verified ground truth outcome and domain expert feedback for a decision.
    Feeds directly into continuous adaptation metrics and historical reliability adjustments.
    """
    record = AdaptationService.record_feedback(
        db=db,
        decision_id=fb_in.decision_id,
        actual_outcome=fb_in.actual_outcome,
        correctness=fb_in.correctness,
        human_feedback=fb_in.human_feedback,
        metadata=fb_in.metadata
    )
    return FeedbackResponse(
        feedback_id=record.id,
        decision_id=record.decision_id,
        user_id=record.user_id,
        actual_outcome=record.actual_outcome,
        correctness=record.correctness,
        human_feedback=record.human_feedback,
        created_at=record.created_at
    )


@router.get("/model/performance", response_model=ModelPerformanceResponse)
def get_model_performance_endpoint(db: Session = Depends(get_db)):
    """
    Retrieve active continuous learning metrics:
    Empirical accuracy, false positive rate, false negative rate, human override rate,
    autonomous decision rate, and performance over time.
    """
    return AdaptationService.get_model_performance(db)


@router.post("/model/retrain", response_model=RetrainResponse)
def trigger_model_retraining(
    background_tasks: BackgroundTasks,
    force_version: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Trigger lightweight adaptive model retraining combining baseline priors with verified ground truth feedback.
    """
    result = AdaptationService.retrain_model_background(db=db, force_version=force_version)
    return result
