from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.review import PendingReviewItem, ReviewActionRequest, ReviewActionResponse
from app.services.human_review_service import HumanReviewService
from app.utils.security import get_current_user, require_roles
from app.utils.logger import get_logger

logger = get_logger("api.reviews")
router = APIRouter(prefix="/reviews", tags=["Human-in-the-Loop Reviews"])


@router.get("/pending", response_model=List[PendingReviewItem])
def list_pending_reviews(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Retrieve all decisions flagged for Human-in-the-Loop review and operator intervention.
    """
    return HumanReviewService.list_pending_reviews(db=db, limit=limit, offset=offset)


@router.post("/{decision_id}/approve", response_model=ReviewActionResponse)
def approve_decision(
    decision_id: str,
    action_req: ReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "HUMAN_REVIEWER", "ANALYST"]))
):
    """
    Human Operator approves the system recommended decision.
    """
    return HumanReviewService.process_review_action(
        db=db,
        decision_id=decision_id,
        reviewer=current_user,
        action_type="APPROVE",
        reason=action_req.reason
    )


@router.post("/{decision_id}/reject", response_model=ReviewActionResponse)
def reject_decision(
    decision_id: str,
    action_req: ReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "HUMAN_REVIEWER", "ANALYST"]))
):
    """
    Human Operator rejects the system decision, overriding automated action.
    """
    return HumanReviewService.process_review_action(
        db=db,
        decision_id=decision_id,
        reviewer=current_user,
        action_type="REJECT",
        reason=action_req.reason
    )


@router.post("/{decision_id}/modify", response_model=ReviewActionResponse)
def modify_decision(
    decision_id: str,
    action_req: ReviewActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "HUMAN_REVIEWER", "ANALYST"]))
):
    """
    Human Operator overrides and customizes the recommended action.
    """
    return HumanReviewService.process_review_action(
        db=db,
        decision_id=decision_id,
        reviewer=current_user,
        action_type="MODIFY",
        reason=action_req.reason,
        modified_action=action_req.modified_action
    )
