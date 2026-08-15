from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PredictRequest(BaseModel):
    data: Dict[str, Any] = Field(..., description="Feature key-value map or processed sensor data")
    model_type: Optional[str] = Field("RandomForestClassifier", description="ML model identifier")
    data_record_id: Optional[str] = Field(None, description="Optional ID of associated ingested DataRecord")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Operational context (e.g. baseline threshold, shift, machine type)")


class PredictResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    prediction_id: Optional[str] = None
    prediction: str
    probability: float
    confidence_score: float
    model_version: str
    model_type: str
    important_features: Dict[str, float]
    class_probabilities: Dict[str, float] = Field(default_factory=dict)
    timestamp: datetime
