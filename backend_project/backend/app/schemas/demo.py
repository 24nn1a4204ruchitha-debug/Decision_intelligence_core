from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class DemoStartRequest(BaseModel):
    interval_seconds: Optional[int] = Field(3, ge=1, le=60, description="Interval in seconds between generated simulation events")
    event_distribution: Optional[Dict[str, float]] = Field(
        default={
            "NORMAL_EVENT": 0.45,
            "ANOMALOUS_EVENT": 0.20,
            "MISSING_DATA_EVENT": 0.15,
            "CORRUPTED_DATA_EVENT": 0.10,
            "HIGH_RISK_EVENT": 0.10
        },
        description="Probability distribution for simulation scenarios"
    )


class DemoStatusResponse(BaseModel):
    is_running: bool
    interval_seconds: int
    total_events_generated: int
    last_event_type: Optional[str] = None
    last_event_timestamp: Optional[datetime] = None
    active_scenario: str


class DemoScenarioTrigger(BaseModel):
    scenario_type: str = Field(
        ...,
        description="Event scenario type: NORMAL_EVENT, ANOMALOUS_EVENT, MISSING_DATA_EVENT, CORRUPTED_DATA_EVENT, HIGH_RISK_EVENT, LOW_CONFIDENCE_EVENT"
    )
    custom_overrides: Optional[Dict[str, Any]] = None
