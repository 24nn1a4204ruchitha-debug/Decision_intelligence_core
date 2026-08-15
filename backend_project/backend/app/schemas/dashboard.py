from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RecentDecisionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    decision: str
    recommended_action: str
    risk_level: str
    confidence_score: float
    uncertainty_score: float
    reliability_level: str
    status: str
    requires_human_review: bool
    executed_autonomously: bool
    timestamp: datetime


class RecentAnomalyItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    anomaly_detected: bool
    anomaly_score: float
    severity: str
    explanation: Optional[str] = None
    affected_features: List[str]
    timestamp: datetime


class DashboardOverviewResponse(BaseModel):
    total_decisions: int
    autonomous_decisions: int
    human_reviewed_decisions: int
    pending_reviews_count: int
    anomalies_detected: int
    high_risk_decisions: int
    average_confidence: float
    average_data_quality: float
    model_accuracy: float
    human_override_rate: float
    reliability_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]


class SystemHealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    database_connected: bool
    active_model_version: str
    active_ml_models: List[str]
    data_pipeline_status: str
    simulation_running: bool
    active_websocket_connections: int
    timestamp: datetime
