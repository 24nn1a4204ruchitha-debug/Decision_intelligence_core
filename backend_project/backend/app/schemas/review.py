from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ReviewActionRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Human reviewer justification")
    modified_action: Optional[str] = Field(None, description="New recommended action if modifying the decision")
    notes: Optional[str] = None


class PendingReviewItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    review_id: str
    decision_id: str
    original_decision: str
    recommended_action: str
    risk_level: str
    confidence_score: float
    uncertainty_score: float
    reliability: str
    reasons: List[str]
    explanation: List[str]
    original_data: Dict[str, Any]
    prediction_info: Optional[Dict[str, Any]] = None
    anomaly_info: Optional[Dict[str, Any]] = None
    created_at: datetime


class ReviewActionResponse(BaseModel):
    review_id: str
    decision_id: str
    reviewer_id: str
    reviewer_username: str
    original_decision: str
    human_decision: str
    final_action: str
    review_status: str
    reason: str
    reviewed_at: datetime
