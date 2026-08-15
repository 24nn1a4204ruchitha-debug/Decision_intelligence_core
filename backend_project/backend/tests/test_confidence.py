from datetime import datetime, timezone, timedelta
from app.services.confidence_service import ConfidenceService


def test_confidence_calculation_nominal():
    result = ConfidenceService.estimate_confidence(
        model_probability=0.95,
        data_quality_score=1.0,
        missing_ratio=0.0,
        anomaly_score=0.10,
        input_timestamp=datetime.now(timezone.utc),
        historical_reliability=0.94
    )
    assert result["confidence_score"] >= 0.80
    assert result["reliability"] == "HIGH"
    assert result["uncertainty_score"] <= 0.20


def test_confidence_calculation_degraded():
    result = ConfidenceService.estimate_confidence(
        model_probability=0.50,
        data_quality_score=0.40,
        missing_ratio=0.40,
        anomaly_score=0.85,
        input_timestamp=datetime.now(timezone.utc) - timedelta(hours=2),  # Stale data
        historical_reliability=0.75
    )
    assert result["confidence_score"] < 0.60
    assert result["reliability"] in ("LOW", "UNRELIABLE")
    assert result["uncertainty_score"] > 0.40
