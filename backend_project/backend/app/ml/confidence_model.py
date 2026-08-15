from typing import Dict, Any, Tuple
from datetime import datetime, timezone
from app.utils.logger import get_logger

logger = get_logger("ml.confidence_model")

# Factor weight configuration
CONFIDENCE_WEIGHTS = {
    "model_probability": 0.30,
    "data_quality": 0.25,
    "data_completeness": 0.15,
    "nominal_consistency": 0.15,  # 1.0 - anomaly_score
    "historical_reliability": 0.10,
    "input_freshness": 0.05
}


class ConfidenceEstimator:
    """
    Multi-factor uncertainty and confidence estimation engine.
    Calculates quantifiable confidence based on epistemic model uncertainty,
    aleatoric data noise, missing fields, anomaly severity, and empirical performance.
    """
    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or CONFIDENCE_WEIGHTS
        # Normalize weights to sum exactly to 1.0
        total_w = sum(self.weights.values())
        self.weights = {k: v / total_w for k, v in self.weights.items()}

    def calculate(
        self,
        model_probability: float,
        data_quality_score: float = 1.0,
        missing_ratio: float = 0.0,
        anomaly_score: float = 0.0,
        historical_reliability: float = 0.92,
        input_timestamp: datetime = None
    ) -> Dict[str, Any]:
        """
        Calculate composite confidence, uncertainty, and reliability level.
        """
        # 1. Model probability component
        f_model = max(0.0, min(1.0, float(model_probability)))

        # 2. Data quality score component
        f_quality = max(0.0, min(1.0, float(data_quality_score)))

        # 3. Completeness component (1 - missing ratio)
        f_completeness = max(0.0, min(1.0, 1.0 - float(missing_ratio)))

        # 4. Nominal consistency component (1 - anomaly score)
        f_nominal = max(0.0, min(1.0, 1.0 - float(anomaly_score)))

        # 5. Historical reliability
        f_historical = max(0.0, min(1.0, float(historical_reliability)))

        # 6. Input Freshness
        f_freshness = 1.0
        if input_timestamp:
            now = datetime.now(timezone.utc)
            if input_timestamp.tzinfo is None:
                input_timestamp = input_timestamp.replace(tzinfo=timezone.utc)
            age_seconds = max(0.0, (now - input_timestamp).total_seconds())
            if age_seconds > 3600:  # Stale data (> 1 hr)
                f_freshness = 0.4
            elif age_seconds > 300:  # Older than 5 min
                f_freshness = 0.7
            elif age_seconds > 60:
                f_freshness = 0.9

        breakdown = {
            "model_probability": round(f_model, 4),
            "data_quality": round(f_quality, 4),
            "data_completeness": round(f_completeness, 4),
            "nominal_consistency": round(f_nominal, 4),
            "historical_reliability": round(f_historical, 4),
            "input_freshness": round(f_freshness, 4)
        }

        weighted_confidence = (
            self.weights["model_probability"] * f_model +
            self.weights["data_quality"] * f_quality +
            self.weights["data_completeness"] * f_completeness +
            self.weights["nominal_consistency"] * f_nominal +
            self.weights["historical_reliability"] * f_historical +
            self.weights["input_freshness"] * f_freshness
        )

        confidence_score = round(max(0.0, min(1.0, weighted_confidence)), 4)
        uncertainty_score = round(max(0.0, min(1.0, 1.0 - confidence_score)), 4)

        # Reliability Level
        if confidence_score >= 0.80:
            reliability = "HIGH"
        elif confidence_score >= 0.60:
            reliability = "MEDIUM"
        elif confidence_score >= 0.40:
            reliability = "LOW"
        else:
            reliability = "UNRELIABLE"

        return {
            "confidence_score": confidence_score,
            "uncertainty_score": uncertainty_score,
            "reliability": reliability,
            "factor_weights": self.weights,
            "breakdown": breakdown
        }
