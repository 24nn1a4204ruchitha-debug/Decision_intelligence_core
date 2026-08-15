import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, ForeignKey, Text
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    decision_id = Column(String(36), ForeignKey("decisions.id", ondelete="SET NULL"), nullable=True, index=True)
    data_record_id = Column(String(36), ForeignKey("data_records.id", ondelete="SET NULL"), nullable=True, index=True)
    actor = Column(String(100), default="SYSTEM", nullable=False, index=True)  # SYSTEM or user username/email
    event_type = Column(String(100), nullable=False, index=True)  # DECISION_EVALUATED, HUMAN_OVERRIDE, MODEL_RETRAINED, ANOMALY_ALERT
    
    prediction = Column(String(100), nullable=True)
    confidence_score = Column(Float, nullable=True)
    anomaly_score = Column(Float, nullable=True)
    decision = Column(String(50), nullable=True, index=True)
    action_taken = Column(String(255), nullable=True)
    human_intervention = Column(Boolean, default=False, nullable=False, index=True)
    explanation_summary = Column(Text, nullable=True)
    final_outcome = Column(String(255), nullable=True)
    
    snapshot_details = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
