import asyncio
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.models.human_review import HumanReview
from app.models.decision import Decision
from app.models.audit_log import AuditLog
from app.models.user import User
from app.services.websocket_manager import ws_manager
from app.utils.logger import get_logger

logger = get_logger("services.human_review")


class HumanReviewService:
    """
    Service managing Human-in-the-loop (HITL) pending reviews, approvals, rejections, and modifications.
    """

    @staticmethod
    def list_pending_reviews(db: Session, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Retrieve all decisions currently awaiting human review."""
        reviews = db.query(HumanReview).filter(HumanReview.review_status == "PENDING").order_by(HumanReview.created_at.desc()).offset(offset).limit(limit).all()
        results = []

        for rev in reviews:
            decision = db.query(Decision).filter(Decision.id == rev.decision_id).first()
            snapshot = rev.snapshot or {}
            results.append({
                "review_id": rev.id,
                "decision_id": rev.decision_id,
                "original_decision": rev.original_decision,
                "recommended_action": decision.recommended_action if decision else rev.modified_action,
                "risk_level": decision.risk_level if decision else "MEDIUM",
                "confidence_score": decision.confidence_score if decision else 0.5,
                "uncertainty_score": decision.uncertainty_score if decision else 0.5,
                "reliability": decision.reliability_level if decision else "MEDIUM",
                "reasons": decision.reasons if decision else [],
                "explanation": decision.explanation if decision else [],
                "original_data": snapshot.get("data", {}),
                "prediction_info": snapshot.get("prediction"),
                "anomaly_info": snapshot.get("anomaly"),
                "created_at": rev.created_at
            })
        return results

    @staticmethod
    def process_review_action(
        db: Session,
        decision_id: str,
        reviewer: User,
        action_type: str,  # APPROVE, REJECT, MODIFY
        reason: str,
        modified_action: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process human review action: update decision status, log audit event, and notify dashboard.
        """
        review = db.query(HumanReview).filter(
            HumanReview.decision_id == decision_id,
            HumanReview.review_status == "PENDING"
        ).first()

        decision = db.query(Decision).filter(Decision.id == decision_id).first()
        if not decision:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Decision '{decision_id}' not found")

        now = datetime.now(timezone.utc)
        final_action = decision.recommended_action

        if action_type == "APPROVE":
            review_status = "APPROVED"
            decision.status = "HUMAN_APPROVED"
        elif action_type == "REJECT":
            review_status = "REJECTED"
            decision.status = "HUMAN_REJECTED"
            final_action = "ACTION_REJECTED_BY_OPERATOR"
        elif action_type == "MODIFY":
            review_status = "MODIFIED"
            decision.status = "HUMAN_MODIFIED"
            final_action = modified_action or f"MODIFIED: {decision.recommended_action}"
            decision.recommended_action = final_action
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported review action '{action_type}'")

        # Update HumanReview record
        if review:
            review.reviewer_id = reviewer.id
            review.human_decision = action_type
            review.reason = reason
            review.modified_action = final_action
            review.review_status = review_status
            review.reviewed_at = now
        else:
            # Create review record if decision didn't have one pre-generated
            review = HumanReview(
                decision_id=decision.id,
                reviewer_id=reviewer.id,
                original_decision=decision.decision,
                human_decision=action_type,
                modified_action=final_action,
                reason=reason,
                review_status=review_status,
                created_at=decision.created_at,
                reviewed_at=now
            )
            db.add(review)

        # Record human intervention in Audit Trail
        audit_log = AuditLog(
            decision_id=decision.id,
            data_record_id=decision.data_record_id,
            actor=reviewer.username,
            event_type=f"HUMAN_REVIEW_{action_type}",
            prediction=None,
            confidence_score=decision.confidence_score,
            anomaly_score=None,
            decision=decision.decision,
            action_taken=final_action,
            human_intervention=True,
            explanation_summary=f"Human Reviewer ({reviewer.username}) applied '{action_type}': {reason}",
            final_outcome=f"RESOLVED_{review_status}",
            snapshot_details={"reviewer_id": reviewer.id, "reason": reason, "modified_action": modified_action},
            timestamp=now
        )
        db.add(audit_log)
        db.commit()
        db.refresh(review)

        # Notify via WebSockets
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(ws_manager.broadcast("HUMAN_REVIEW_COMPLETED", {
                    "decision_id": decision.id,
                    "action_type": action_type,
                    "reviewer": reviewer.username,
                    "final_action": final_action,
                    "status": decision.status
                }))
        except Exception as e:
            logger.debug(f"Async broadcast task creation deferred: {e}")

        logger.info(f"Decision [{decision.id}] reviewed by {reviewer.username}: {action_type}")

        return {
            "review_id": review.id,
            "decision_id": decision.id,
            "reviewer_id": reviewer.id,
            "reviewer_username": reviewer.username,
            "original_decision": decision.decision,
            "human_decision": action_type,
            "final_action": final_action,
            "review_status": review_status,
            "reason": reason,
            "reviewed_at": now
        }
