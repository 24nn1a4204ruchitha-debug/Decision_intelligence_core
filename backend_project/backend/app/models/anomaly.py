import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, ForeignKey, Text
from app.database import Base


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    data_record_id = Column(String(36), ForeignKey("data_records.id", ondelete="SET NULL"), nullable=True, index=True)
    anomaly_detected = Column(Boolean, default=False, nullable=False, index=True)
    anomaly_score = Column(Float, nullable=False, index=True)  # Normalized 0.0 - 1.0 (higher = more anomalous)
    severity = Column(String(50), default="LOW", nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    affected_features = Column(JSON, default=list, nullable=False)
    explanation = Column(Text, nullable=True)
    algorithm = Column(String(100), default="IsolationForest", nullable=False)
    raw_metrics = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
