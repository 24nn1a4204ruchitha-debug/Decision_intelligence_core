from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.anomaly import Anomaly
from app.ml.model_registry import registry
from app.utils.logger import get_logger

logger = get_logger("services.anomaly")


class AnomalyService:
    """
    Service orchestrating anomaly detection, database recording, and anomaly log queries.
    """

    @staticmethod
    def detect_anomaly(
        db: Optional[Session],
        data: Dict[str, Any],
        data_record_id: Optional[str] = None,
        algorithm: str = "IsolationForest"
    ) -> Dict[str, Any]:
        """
        Detect anomalies using isolation forest & statistical scoring.
        """
        detector = registry.get_anomaly_detector()
        result = detector.detect(data)

        anomaly_id = None
        if db is not None:
            db_anomaly = Anomaly(
                data_record_id=data_record_id,
                anomaly_detected=result["anomaly_detected"],
                anomaly_score=result["anomaly_score"],
                severity=result["severity"],
                affected_features=result["affected_features"],
                explanation=result["explanation"],
                algorithm=result["algorithm"],
                raw_metrics=result["feature_contributions"],
                timestamp=result["timestamp"]
            )
            db.add(db_anomaly)
            db.commit()
            db.refresh(db_anomaly)
            anomaly_id = db_anomaly.id

        return {
            "anomaly_id": anomaly_id,
            "anomaly_detected": result["anomaly_detected"],
            "anomaly_score": result["anomaly_score"],
            "severity": result["severity"],
            "explanation": result["explanation"],
            "affected_features": result["affected_features"],
            "feature_contributions": result["feature_contributions"],
            "algorithm": result["algorithm"],
            "timestamp": result["timestamp"]
        }

    @staticmethod
    def list_anomalies(
        db: Session,
        limit: int = 50,
        offset: int = 0,
        severity: Optional[str] = None,
        only_detected: bool = True
    ) -> List[Anomaly]:
        """Query anomalies with optional filtering by severity and detected status."""
        query = db.query(Anomaly)
        if only_detected:
            query = query.filter(Anomaly.anomaly_detected == True)
        if severity:
            query = query.filter(Anomaly.severity == severity)
        return query.order_by(Anomaly.timestamp.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_anomaly(db: Session, anomaly_id: str) -> Optional[Anomaly]:
        """Fetch single anomaly by UUID."""
        return db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
