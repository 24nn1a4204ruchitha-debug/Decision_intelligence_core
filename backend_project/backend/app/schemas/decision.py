from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class DecisionEvaluateRequest(BaseModel):
    data: Dict[str, Any] = Field(..., description="Ingested/processed data or sensor reading payload")
    data_record_id: Optional[str] = Field(None, description="Optional ID of existing DataRecord")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Operational context")
    risk_tolerance: Optional[str] = Field("STANDARD", description="Risk tolerance mode: CONSERVATIVE, STANDARD, AGGRESSIVE")
    force_human_review: Optional[bool] = Field(False, description="Manual flag to force human review for simulation/test")


class ConfidenceDetail(BaseModel):
    confidence_score: float
    uncertainty_score: float
    reliability: str
    factor_weights: Dict[str, float]
    breakdown: Dict[str, float]


class DecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    decision_id: str
    decision: str  # APPROVE, REJECT, MONITOR, ESCALATE, REQUEST_HUMAN_REVIEW
    recommended_action: str
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    confidence_score: float
    uncertainty_score: float
    reliability: str  # HIGH, MEDIUM, LOW, UNRELIABLE
    requires_human_review: bool
    executed_autonomously: bool
    status: str
    explanation: List[str]
    nl_explanation: Optional[str] = None
    reasons: List[str]
    prediction_summary: Optional[Dict[str, Any]] = None
    anomaly_summary: Optional[Dict[str, Any]] = None
    confidence_details: Optional[ConfidenceDetail] = None
    timestamp: datetime
