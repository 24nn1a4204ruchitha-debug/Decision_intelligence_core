from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class FeedbackCreate(BaseModel):
    decision_id: str = Field(..., description="UUID of the evaluated decision")
    actual_outcome: str = Field(..., description="Real-world observed outcome (e.g., NORMAL, FAILURE_OCCURRED, FALSE_ALARM)")
    human_feedback: Optional[str] = Field(None, description="Detailed human review or domain expert comments")
    correctness: float = Field(1.0, ge=0.0, le=1.0, description="1.0 if AI decision was correct, 0.0 if incorrect")
    metadata: Optional[Dict[str, Any]] = None


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    feedback_id: str
    decision_id: str
    user_id: Optional[str] = None
    actual_outcome: str
    correctness: float
    human_feedback: Optional[str] = None
    created_at: datetime


class ModelPerformanceResponse(BaseModel):
    active_model_version: str
    total_decisions_evaluated: int
    total_feedbacks_recorded: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    false_negative_rate: float
    human_override_rate: float
    autonomous_decision_rate: float
    average_confidence: float
    average_data_quality: float
    performance_over_time: List[Dict[str, Any]] = Field(default_factory=list)


class RetrainResponse(BaseModel):
    status: str
    new_model_version: str
    samples_trained: int
    previous_accuracy: float
    new_accuracy: float
    timestamp: datetime
    message: str
