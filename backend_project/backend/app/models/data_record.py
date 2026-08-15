import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, JSON, Text
from app.database import Base


class DataRecord(Base):
    __tablename__ = "data_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    source = Column(String(100), default="default_stream", nullable=False, index=True)
    data_type = Column(String(50), nullable=False, index=True)  # text, json, csv, image, sensor, event
    raw_data = Column(JSON, nullable=False)
    processed_data = Column(JSON, nullable=True)
    metadata_info = Column(JSON, nullable=True)
    quality_score = Column(Float, default=1.0, nullable=False, index=True)
    missing_fields = Column(JSON, default=list, nullable=False)
    corruption_flag = Column(Boolean, default=False, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
