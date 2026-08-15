import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, ForeignKey, Text
from app.database import Base


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    data_record_id = Column(String(36), ForeignKey("data_records.id", ondelete="SET NULL"), nullable=True, index=True)
    prediction_id = Column(String(36), ForeignKey("predictions.id", ondelete="SET NULL"), nullable=True, index=True)
    anomaly_id = Column(String(36), ForeignKey("anomalies.id", ondelete="SET NULL"), nullable=True, index=True)
    
    decision = Column(String(50), nullable=False, index=True)  # APPROVE, REJECT, MONITOR, ESCALATE, REQUEST_HUMAN_REVIEW
    recommended_action = Column(String(255), nullable=False)
    risk_level = Column(String(50), default="LOW", nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    
    confidence_score = Column(Float, nullable=False, index=True)
    uncertainty_score = Column(Float, nullable=False, index=True)
    reliability_level = Column(String(50), default="HIGH", nullable=False, index=True)  # HIGH, MEDIUM, LOW, UNRELIABLE
    
    requires_human_review = Column(Boolean, default=False, nullable=False, index=True)
    reasons = Column(JSON, default=list, nullable=False)
    explanation = Column(JSON, default=list, nullable=False)
    nl_explanation = Column(Text, nullable=True)  # Natural language explanation from LLM/fallback
    
    executed_autonomously = Column(Boolean, default=False, nullable=False, index=True)
    status = Column(String(50), default="EXECUTED", nullable=False, index=True)  # EXECUTED, PENDING_REVIEW, APPROVED, REJECTED, MODIFIED
    
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
