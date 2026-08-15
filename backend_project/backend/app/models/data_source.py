import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from app.database import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    source_type = Column(String(50), nullable=False)  # sensor, csv, api, event_stream, image
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    meta_info = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
