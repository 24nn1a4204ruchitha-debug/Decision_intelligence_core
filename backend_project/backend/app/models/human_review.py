import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from app.database import Base


class HumanReview(Base):
    __tablename__ = "human_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    decision_id = Column(String(36), ForeignKey("decisions.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    original_decision = Column(String(50), nullable=False)
    human_decision = Column(String(50), nullable=True)  # APPROVE, REJECT, MODIFY
    modified_action = Column(String(255), nullable=True)
    reason = Column(Text, nullable=True)
    review_status = Column(String(50), default="PENDING", nullable=False, index=True)  # PENDING, APPROVED, REJECTED, MODIFIED
    
    snapshot = Column(JSON, nullable=True)  # Snapshot of original data, prediction, XAI explanation
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True, index=True)
