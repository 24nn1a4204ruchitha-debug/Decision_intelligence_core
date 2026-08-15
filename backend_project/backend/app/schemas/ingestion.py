from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class TextInput(BaseModel):
    text: str = Field(..., description="Unstructured or log text")
    source: str = Field("text_input", description="Data source identifier")
    metadata: Optional[Dict[str, Any]] = None


class JsonInput(BaseModel):
    payload: Dict[str, Any] = Field(..., description="Arbitrary JSON payload")
    source: str = Field("json_input", description="Data source identifier")
    metadata: Optional[Dict[str, Any]] = None


class SensorInput(BaseModel):
    source: str = Field("industrial_sensor", description="Sensor stream ID")
    temperature: Optional[float] = Field(None, description="Temperature in Celsius (-40 to 200)")
    pressure: Optional[float] = Field(None, description="Pressure in Bar (0 to 100)")
    vibration: Optional[float] = Field(None, description="Vibration in mm/s (0 to 50)")
    energy_usage: Optional[float] = Field(None, description="Energy usage in kW (0 to 1000)")
    humidity: Optional[float] = Field(None, description="Humidity percentage (0 to 100)")
    machine_id: Optional[str] = Field("MACHINE_A1", description="Identifier of the equipment")
    metadata: Optional[Dict[str, Any]] = None


class EventInput(BaseModel):
    source: str = Field("event_stream", description="Event source")
    event_type: str = Field(..., description="Event type identifier")
    severity: Optional[str] = Field("INFO", description="Event severity (INFO, WARN, CRITICAL)")
    payload: Dict[str, Any] = Field(..., description="Event body payload")
    metadata: Optional[Dict[str, Any]] = None


class IngestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source: str
    data_type: str
    timestamp: datetime
    quality_score: float
    missing_fields: List[str]
    corruption_flag: bool
    imputed_fields: List[str] = []
    processed_data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None


class DegradationSimInput(BaseModel):
    missing_percentage: float = Field(0.25, ge=0.0, le=1.0, description="Percentage of fields to simulate as missing (0.0 to 1.0)")
    corrupted_percentage: float = Field(0.10, ge=0.0, le=1.0, description="Percentage of fields to inject corrupted/extreme values into")
    base_payload: Optional[Dict[str, Any]] = None


class DegradationSimResponse(BaseModel):
    percentage_missing: float
    percentage_corrupted: float
    affected_fields: List[str]
    original_quality_score: float
    degraded_quality_score: float
    system_status: str
    fallback_strategy: str
    imputed_values: Dict[str, Any]
    degraded_payload: Dict[str, Any]
    data_record_id: Optional[str] = None
