from typing import Dict, Any, Optional
from datetime import datetime
from app.ml.model_registry import registry
from app.utils.logger import get_logger

logger = get_logger("services.confidence")


class ConfidenceService:
    """
    Orchestrator for multi-factor confidence and epistemic uncertainty evaluation.
    """

    @staticmethod
    def estimate_confidence(
        model_probability: float,
        data_quality_score: float = 1.0,
        missing_ratio: float = 0.0,
        anomaly_score: float = 0.0,
        input_timestamp: Optional[datetime] = None,
        historical_reliability: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Evaluate composite confidence combining model confidence, data quality,
        completeness, anomaly severity, freshness, and empirical accuracy.
        """
        estimator = registry.get_confidence_estimator()
        hist_acc = historical_reliability if historical_reliability is not None else registry.historical_accuracy

        result = estimator.calculate(
            model_probability=model_probability,
            data_quality_score=data_quality_score,
            missing_ratio=missing_ratio,
            anomaly_score=anomaly_score,
            historical_reliability=hist_acc,
            input_timestamp=input_timestamp
        )
        return result
