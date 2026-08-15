from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.anomaly import AnomalyDetectRequest, AnomalyDetectResponse, AnomalyDetailResponse
from app.services.anomaly_service import AnomalyService
from app.utils.logger import get_logger

logger = get_logger("api.anomalies")
router = APIRouter(tags=["Anomaly Detection"])


@router.post("/anomaly/detect", response_model=AnomalyDetectResponse)
def detect_anomaly_endpoint(req: AnomalyDetectRequest, db: Session = Depends(get_db)):
    """
    Detect anomalies in input parameters using Isolation Forest & statistical z-scoring.
    """
    result = AnomalyService.detect_anomaly(
        db=db,
        data=req.data,
        data_record_id=req.data_record_id,
        algorithm=req.algorithm or "IsolationForest"
    )
    return result


@router.get("/anomalies", response_model=List[AnomalyDetailResponse])
def get_all_anomalies(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    only_detected: bool = Query(True, description="Only return records where anomaly was detected"),
    db: Session = Depends(get_db)
):
    """
    List historical anomaly detection logs with optional severity filtering.
    """
    records = AnomalyService.list_anomalies(db=db, limit=limit, offset=offset, severity=severity, only_detected=only_detected)
    return [
        AnomalyDetailResponse(
            anomaly_id=r.id,
            anomaly_detected=r.anomaly_detected,
            anomaly_score=r.anomaly_score,
            severity=r.severity,
            explanation=r.explanation,
            affected_features=r.affected_features,
            feature_contributions=r.raw_metrics or {},
            algorithm=r.algorithm,
            raw_metrics=r.raw_metrics,
            data_record_id=r.data_record_id,
            timestamp=r.timestamp
        )
        for r in records
    ]


@router.get("/anomalies/{anomaly_id}", response_model=AnomalyDetailResponse)
def get_single_anomaly(anomaly_id: str, db: Session = Depends(get_db)):
    """
    Retrieve single anomaly report by UUID.
    """
    r = AnomalyService.get_anomaly(db=db, anomaly_id=anomaly_id)
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Anomaly '{anomaly_id}' not found")
    
    return AnomalyDetailResponse(
        anomaly_id=r.id,
        anomaly_detected=r.anomaly_detected,
        anomaly_score=r.anomaly_score,
        severity=r.severity,
        explanation=r.explanation,
        affected_features=r.affected_features,
        feature_contributions=r.raw_metrics or {},
        algorithm=r.algorithm,
        raw_metrics=r.raw_metrics,
        data_record_id=r.data_record_id,
        timestamp=r.timestamp
    )
