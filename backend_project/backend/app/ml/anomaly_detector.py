import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone
from app.utils.logger import get_logger

logger = get_logger("ml.anomaly_detector")

FEATURE_NAMES = ["temperature", "pressure", "vibration", "energy_usage", "humidity"]

# Baseline distribution statistics for feature deviation measurement
BASE_STATS = {
    "temperature": {"mean": 65.0, "std": 6.0},
    "pressure": {"mean": 30.0, "std": 3.0},
    "vibration": {"mean": 4.0, "std": 1.2},
    "energy_usage": {"mean": 250.0, "std": 25.0},
    "humidity": {"mean": 45.0, "std": 6.0}
}


class AnomalyDetector:
    """
    Isolation Forest and statistical anomaly detector for multidimensional IoT and sensor streams.
    """
    def __init__(self, contamination: float = 0.10):
        self.contamination = contamination
        self.feature_names = FEATURE_NAMES
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=42,
            n_estimators=100
        )
        self._fit_baseline()

    def _fit_baseline(self):
        """Fit Isolation Forest on nominal baseline operational data."""
        np.random.seed(42)
        n = 1000
        temp = np.random.normal(65.0, 5.0, n)
        press = np.random.normal(30.0, 2.5, n)
        vib = np.random.normal(4.0, 1.0, n)
        energy = np.random.normal(250.0, 20.0, n)
        hum = np.random.normal(45.0, 5.0, n)
        
        X_nominal = np.column_stack([temp, press, vib, energy, hum])
        self.model.fit(X_nominal)
        logger.info(f"Anomaly detector calibrated with {n} baseline samples.")

    def _calculate_feature_contributions(self, data: Dict[str, Any]) -> Tuple[List[str], Dict[str, float]]:
        """Calculate z-score deviation for each feature to identify affected features."""
        deviations = {}
        affected = []
        for feat in self.feature_names:
            val = data.get(feat)
            if val is not None and isinstance(val, (int, float)):
                stat = BASE_STATS.get(feat, {"mean": 0.0, "std": 1.0})
                z = abs(float(val) - stat["mean"]) / max(stat["std"], 1e-5)
                deviations[feat] = round(z, 2)
                if z >= 2.2:  # Deviates by more than 2.2 standard deviations
                    affected.append(feat)
            else:
                deviations[feat] = 0.0
        
        # Sort affected features by highest z-score
        affected = sorted(affected, key=lambda f: deviations.get(f, 0.0), reverse=True)
        return affected, deviations

    def detect(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect anomalies in sensor / operational record.
        Returns:
            - anomaly_detected (bool)
            - anomaly_score (float, 0.0 to 1.0)
            - severity (str: LOW, MEDIUM, HIGH, CRITICAL)
            - explanation (str)
            - affected_features (list of str)
            - feature_contributions (dict)
            - algorithm (str)
            - timestamp
        """
        # Build vector with fallback defaults
        defaults = {"temperature": 65.0, "pressure": 30.0, "vibration": 4.0, "energy_usage": 250.0, "humidity": 45.0}
        vector = []
        for feat in self.feature_names:
            v = data.get(feat)
            if v is None or not isinstance(v, (int, float)):
                v = defaults[feat]
            vector.append(float(v))

        X_input = np.array(vector).reshape(1, -1)
        
        # Isolation Forest decision function: lower is more anomalous
        raw_score = self.model.decision_function(X_input)[0]  # typically in [-0.5, 0.5]
        # Invert and scale to [0.0, 1.0] where 1.0 is extremely anomalous
        # decision_function around 0.15 is normal, < 0 is anomalous
        normalized_score = float(1.0 / (1.0 + np.exp(raw_score * 8.0)))
        
        # Calculate feature-level deviation
        affected_features, contributions = self._calculate_feature_contributions(data)
        
        # If severe z-scores present, boost anomaly score if needed
        max_z = max(contributions.values()) if contributions else 0.0
        if max_z > 3.5:
            normalized_score = max(normalized_score, min(0.98, 0.5 + (max_z * 0.1)))

        normalized_score = round(max(0.0, min(1.0, normalized_score)), 4)
        is_anomaly = bool(normalized_score >= 0.55 or len(affected_features) > 0)

        # Severity categorization
        if normalized_score >= 0.85 or max_z >= 4.5:
            severity = "CRITICAL"
        elif normalized_score >= 0.70 or max_z >= 3.0:
            severity = "HIGH"
        elif normalized_score >= 0.50 or is_anomaly:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        # Generate explanatory string
        if not is_anomaly:
            explanation = "Sensor telemetry patterns are within expected operational baseline limits."
        else:
            feat_desc = ", ".join([f"{f} (deviation {contributions[f]}σ)" for f in affected_features[:3]]) or "multivariate pattern divergence"
            explanation = f"Anomaly detected with {severity} severity (score: {normalized_score}). Primary deviating parameters: {feat_desc}."

        return {
            "anomaly_detected": is_anomaly,
            "anomaly_score": normalized_score,
            "severity": severity,
            "explanation": explanation,
            "affected_features": affected_features,
            "feature_contributions": contributions,
            "algorithm": "IsolationForest+StatisticalZScore",
            "timestamp": datetime.now(timezone.utc)
        }
