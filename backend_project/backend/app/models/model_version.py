import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, JSON
from app.database import Base


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    model_name = Column(String(100), nullable=False, index=True)
    version = Column(String(50), nullable=False, unique=True, index=True)
    accuracy = Column(Float, default=0.0, nullable=False)
    f1_score = Column(Float, default=0.0, nullable=False)
    false_positive_rate = Column(Float, default=0.0, nullable=False)
    false_negative_rate = Column(Float, default=0.0, nullable=False)
    trained_samples_count = Column(Integer, default=0, nullable=False)
    hyperparameters = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
