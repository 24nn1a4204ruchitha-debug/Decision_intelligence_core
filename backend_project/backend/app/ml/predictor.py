import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from typing import Dict, Any, Tuple, List
from datetime import datetime, timezone
from app.utils.logger import get_logger

logger = get_logger("ml.predictor")

FEATURE_NAMES = ["temperature", "pressure", "vibration", "energy_usage", "humidity"]
CLASS_LABELS = ["OPTIMAL", "MAINTENANCE_REQUIRED", "CRITICAL_FAILURE_RISK"]


class BaselinePredictor:
    """
    Deterministic baseline machine learning model for operational risk and failure prediction.
    Uses RandomForestClassifier trained on calibrated operational baselines.
    """
    def __init__(self, model_type: str = "RandomForestClassifier", version: str = "v1.0.0"):
        self.model_type = model_type
        self.version = version
        self.feature_names = FEATURE_NAMES
        self.classes_ = CLASS_LABELS
        self.model = None
        self._initialize_and_train_baseline()

    def _generate_synthetic_baseline(self, n_samples: int = 1200) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate representative industrial sensor operational dataset.
        """
        np.random.seed(42)
        X = []
        y = []
        
        # 1. Optimal Operation (Label 0)
        n_optimal = int(n_samples * 0.6)
        temp_opt = np.random.normal(65.0, 5.0, n_optimal)
        press_opt = np.random.normal(30.0, 2.5, n_optimal)
        vib_opt = np.random.normal(4.0, 1.0, n_optimal)
        energy_opt = np.random.normal(250.0, 20.0, n_optimal)
        hum_opt = np.random.normal(45.0, 5.0, n_optimal)
        X_opt = np.column_stack([temp_opt, press_opt, vib_opt, energy_opt, hum_opt])
        y_opt = np.zeros(n_optimal, dtype=int)
        
        # 2. Maintenance Required (Label 1) - slight degradation
        n_maint = int(n_samples * 0.25)
        temp_maint = np.random.normal(85.0, 8.0, n_maint)
        press_maint = np.random.normal(45.0, 6.0, n_maint)
        vib_maint = np.random.normal(12.0, 3.0, n_maint)
        energy_maint = np.random.normal(360.0, 35.0, n_maint)
        hum_maint = np.random.normal(65.0, 8.0, n_maint)
        X_maint = np.column_stack([temp_maint, press_maint, vib_maint, energy_maint, hum_maint])
        y_maint = np.ones(n_maint, dtype=int)
        
        # 3. Critical Failure Risk (Label 2) - extreme levels
        n_crit = n_samples - n_optimal - n_maint
        temp_crit = np.random.normal(115.0, 12.0, n_crit)
        press_opt_crit = np.random.normal(68.0, 8.0, n_crit)
        vib_crit = np.random.normal(28.0, 5.0, n_crit)
        energy_crit = np.random.normal(520.0, 50.0, n_crit)
        hum_crit = np.random.normal(82.0, 10.0, n_crit)
        X_crit = np.column_stack([temp_crit, press_opt_crit, vib_crit, energy_crit, hum_crit])
        y_crit = np.full(n_crit, 2, dtype=int)
        
        X = np.vstack([X_opt, X_maint, X_crit])
        y = np.concatenate([y_opt, y_maint, y_crit])
        return X, y

    def _initialize_and_train_baseline(self):
        """Train baseline model on startup."""
        X, y = self._generate_synthetic_baseline()
        if self.model_type == "GradientBoostingClassifier":
            self.model = GradientBoostingClassifier(n_estimators=100, random_state=42)
        else:
            self.model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        
        self.model.fit(X, y)
        logger.info(f"Predictor initialized: {self.model_type} ({self.version})")

    def extract_feature_vector(self, data: Dict[str, Any]) -> Tuple[np.ndarray, Dict[str, float]]:
        """Extract ordered feature vector from input payload with sensible imputation."""
        # Baseline fallback defaults if field missing
        defaults = {
            "temperature": 65.0,
            "pressure": 30.0,
            "vibration": 4.0,
            "energy_usage": 250.0,
            "humidity": 45.0
        }
        vector = []
        parsed = {}
        for feat in self.feature_names:
            val = data.get(feat)
            if val is None or not isinstance(val, (int, float)):
                val = defaults[feat]
            val = float(val)
            vector.append(val)
            parsed[feat] = val
        return np.array(vector).reshape(1, -1), parsed

    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run prediction on input data dictionary.
        Returns:
            - prediction (str)
            - probability (float)
            - confidence_score (float based on max prob)
            - class_probabilities (dict)
            - important_features (dict)
            - model_version (str)
            - model_type (str)
        """
        X_vec, _ = self.extract_feature_vector(data)
        probabilities = self.model.predict_proba(X_vec)[0]
        pred_idx = int(np.argmax(probabilities))
        pred_label = self.classes_[pred_idx]
        max_prob = float(probabilities[pred_idx])

        # Feature importances
        importances = {}
        if hasattr(self.model, "feature_importances_"):
            for name, imp in zip(self.feature_names, self.model.feature_importances_):
                importances[name] = round(float(imp), 4)

        class_prob_map = {
            self.classes_[i]: round(float(probabilities[i]), 4)
            for i in range(len(self.classes_))
        }

        return {
            "prediction": pred_label,
            "probability": round(max_prob, 4),
            "confidence_score": round(max_prob, 4),
            "class_probabilities": class_prob_map,
            "important_features": importances,
            "model_version": self.version,
            "model_type": self.model_type,
            "timestamp": datetime.now(timezone.utc)
        }

    def retrain(self, X_new: np.ndarray, y_new: np.ndarray, new_version: str) -> float:
        """
        Incrementally retrain or refit model with newly verified feedback data.
        """
        X_base, y_base = self._generate_synthetic_baseline()
        X_combined = np.vstack([X_base, X_new])
        y_combined = np.concatenate([y_base, y_new])
        
        self.model.fit(X_combined, y_combined)
        self.version = new_version
        score = float(self.model.score(X_combined, y_combined))
        logger.info(f"Model retrained to version {self.version} with accuracy: {score:.4f}")
        return score
