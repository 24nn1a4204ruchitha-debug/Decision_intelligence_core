import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey
from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    data_record_id = Column(String(36), ForeignKey("data_records.id", ondelete="SET NULL"), nullable=True, index=True)
    model_type = Column(String(100), default="RandomForestClassifier", nullable=False)
    model_version = Column(String(50), default="v1.0.0", nullable=False, index=True)
    prediction = Column(String(100), nullable=False, index=True)
    probability = Column(Float, nullable=False)
    class_probabilities = Column(JSON, nullable=True)
    confidence_score = Column(Float, nullable=False, index=True)
    important_features = Column(JSON, default=dict, nullable=False)
    raw_input_snapshot = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
