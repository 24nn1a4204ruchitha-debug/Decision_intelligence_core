from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class AnomalyDetectRequest(BaseModel):
    data: Dict[str, Any] = Field(..., description="Sensor or numerical record payload")
    algorithm: Optional[str] = Field("IsolationForest", description="Anomaly detection algorithm to use")
    data_record_id: Optional[str] = Field(None, description="Optional ID of associated ingested DataRecord")
    contamination: Optional[float] = Field(0.10, description="Contamination factor")


class AnomalyDetectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    anomaly_id: Optional[str] = None
    anomaly_detected: bool
    anomaly_score: float  # Normalized 0.0 - 1.0
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    explanation: str
    affected_features: List[str]
    feature_contributions: Dict[str, float] = Field(default_factory=dict)
    algorithm: str
    timestamp: datetime


class AnomalyDetailResponse(AnomalyDetectResponse):
    raw_metrics: Optional[Dict[str, Any]] = None
    data_record_id: Optional[str] = None
