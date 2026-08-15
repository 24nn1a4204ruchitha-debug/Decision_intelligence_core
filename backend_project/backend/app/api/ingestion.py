from typing import List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.ingestion import (
    TextInput, JsonInput, SensorInput, EventInput, IngestionResponse,
    DegradationSimInput, DegradationSimResponse
)
from app.services.ingestion_service import IngestionService
from app.services.websocket_manager import ws_manager
from app.utils.logger import get_logger
import asyncio

logger = get_logger("api.ingestion")
router = APIRouter(prefix="/data", tags=["Multimodal Data Ingestion"])


@router.post("/sensor", response_model=IngestionResponse, status_code=status.HTTP_201_CREATED)
def ingest_sensor_data(data: SensorInput, db: Session = Depends(get_db)):
    """
    Ingest real-time IoT or industrial sensor stream data.
    """
    payload = {
        "temperature": data.temperature,
        "pressure": data.pressure,
        "vibration": data.vibration,
        "energy_usage": data.energy_usage,
        "humidity": data.humidity
    }
    record = IngestionService.ingest_sensor(
        db=db,
        data=payload,
        source=data.source,
        metadata={"machine_id": data.machine_id, **(data.metadata or {})}
    )
    
    # Broadcast event
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(ws_manager.broadcast("DATA_INGESTED", {
                "record_id": record.id,
                "data_type": "sensor",
                "quality_score": record.quality_score
            }))
    except Exception:
        pass

    return IngestionResponse(
        id=record.id,
        source=record.source,
        data_type=record.data_type,
        timestamp=record.timestamp,
        quality_score=record.quality_score,
        missing_fields=record.missing_fields,
        corruption_flag=record.corruption_flag,
        imputed_fields=record.metadata_info.get("imputed_fields", []),
        processed_data=record.processed_data,
        metadata=record.metadata_info
    )


@router.post("/text", response_model=IngestionResponse, status_code=status.HTTP_201_CREATED)
def ingest_text_data(data: TextInput, db: Session = Depends(get_db)):
    """
    Ingest unstructured text or log streams.
    """
    record = IngestionService.ingest_text(
        db=db,
        text=data.text,
        source=data.source,
        metadata=data.metadata
    )
    return IngestionResponse(
        id=record.id,
        source=record.source,
        data_type=record.data_type,
        timestamp=record.timestamp,
        quality_score=record.quality_score,
        missing_fields=record.missing_fields,
        corruption_flag=record.corruption_flag,
        imputed_fields=record.metadata_info.get("imputed_fields", []),
        processed_data=record.processed_data,
        metadata=record.metadata_info
    )


@router.post("/json", response_model=IngestionResponse, status_code=status.HTTP_201_CREATED)
def ingest_json_data(data: JsonInput, db: Session = Depends(get_db)):
    """
    Ingest structured JSON payloads.
    """
    record = IngestionService.ingest_json(
        db=db,
        payload=data.payload,
        source=data.source,
        metadata=data.metadata
    )
    return IngestionResponse(
        id=record.id,
        source=record.source,
        data_type=record.data_type,
        timestamp=record.timestamp,
        quality_score=record.quality_score,
        missing_fields=record.missing_fields,
        corruption_flag=record.corruption_flag,
        imputed_fields=record.metadata_info.get("imputed_fields", []),
        processed_data=record.processed_data,
        metadata=record.metadata_info
    )


@router.post("/event", response_model=IngestionResponse, status_code=status.HTTP_201_CREATED)
def ingest_event_data(data: EventInput, db: Session = Depends(get_db)):
    """
    Ingest real-time discrete system events.
    """
    record = IngestionService.ingest_event(
        db=db,
        event_type=data.event_type,
        payload=data.payload,
        severity=data.severity or "INFO",
        source=data.source,
        metadata=data.metadata
    )
    return IngestionResponse(
        id=record.id,
        source=record.source,
        data_type=record.data_type,
        timestamp=record.timestamp,
        quality_score=record.quality_score,
        missing_fields=record.missing_fields,
        corruption_flag=record.corruption_flag,
        imputed_fields=record.metadata_info.get("imputed_fields", []),
        processed_data=record.processed_data,
        metadata=record.metadata_info
    )


@router.post("/csv", response_model=List[IngestionResponse], status_code=status.HTTP_201_CREATED)
async def ingest_csv_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Ingest tabular CSV historical records or batch telemetry.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a CSV (.csv)")
    
    content = await file.read()
    records = IngestionService.ingest_csv_content(db, content, file.filename)
    return [
        IngestionResponse(
            id=r.id,
            source=r.source,
            data_type=r.data_type,
            timestamp=r.timestamp,
            quality_score=r.quality_score,
            missing_fields=r.missing_fields,
            corruption_flag=r.corruption_flag,
            imputed_fields=r.metadata_info.get("imputed_fields", []) if r.metadata_info else [],
            processed_data=r.processed_data,
            metadata=r.metadata_info
        )
        for r in records
    ]


@router.post("/image", response_model=IngestionResponse, status_code=status.HTTP_201_CREATED)
def ingest_image_data(file: UploadFile = File(...), source: str = Form("image_upload"), db: Session = Depends(get_db)):
    """
    Ingest images (e.g. thermal or inspection camera images) and extract computer vision telemetry.
    """
    record = IngestionService.ingest_image_file(db, file, source=source)
    return IngestionResponse(
        id=record.id,
        source=record.source,
        data_type=record.data_type,
        timestamp=record.timestamp,
        quality_score=record.quality_score,
        missing_fields=record.missing_fields,
        corruption_flag=record.corruption_flag,
        imputed_fields=[],
        processed_data=record.processed_data,
        metadata=record.metadata_info
    )


@router.post("/simulate-degradation", response_model=DegradationSimResponse)
def simulate_degraded_data(sim_in: DegradationSimInput, db: Session = Depends(get_db)):
    """
    Track 01 Hard Mode: Simulate system performance under 20-30% missing or corrupted data.
    Demonstrates safe automated imputation and resilient degradation tracking.
    """
    result = IngestionService.simulate_data_degradation(
        db=db,
        missing_pct=sim_in.missing_percentage,
        corrupted_pct=sim_in.corrupted_percentage,
        base_payload=sim_in.base_payload
    )
    return result
