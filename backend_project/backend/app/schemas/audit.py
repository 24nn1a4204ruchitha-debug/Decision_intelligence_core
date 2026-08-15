from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    decision_id: Optional[str] = None
    data_record_id: Optional[str] = None
    actor: str
    event_type: str
    prediction: Optional[str] = None
    confidence_score: Optional[float] = None
    anomaly_score: Optional[float] = None
    decision: Optional[str] = None
    action_taken: Optional[str] = None
    human_intervention: bool
    explanation_summary: Optional[str] = None
    final_outcome: Optional[str] = None
    snapshot_details: Optional[Dict[str, Any]] = None
    timestamp: datetime
