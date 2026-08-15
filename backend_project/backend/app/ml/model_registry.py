from typing import Dict, Any, Optional
from app.ml.predictor import BaselinePredictor
from app.ml.anomaly_detector import AnomalyDetector
from app.ml.confidence_model import ConfidenceEstimator
from app.utils.logger import get_logger

logger = get_logger("ml.registry")


class ModelRegistry:
    """
    Singleton registry managing active machine learning predictors,
    anomaly detectors, and uncertainty estimators.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if not getattr(self, "initialized", False):
            self.predictor = BaselinePredictor(model_type="RandomForestClassifier", version="v1.0.0")
            self.anomaly_detector = AnomalyDetector(contamination=0.10)
            self.confidence_estimator = ConfidenceEstimator()
            self.historical_accuracy = 0.94
            self.model_catalog: Dict[str, Any] = {
                "RandomForestClassifier": self.predictor,
                "GradientBoostingClassifier": BaselinePredictor(model_type="GradientBoostingClassifier", version="v1.0.0-gb")
            }
            self.active_model_name = "RandomForestClassifier"
            self.initialized = True
            logger.info("ModelRegistry initialized with default models.")

    def get_predictor(self, model_type: Optional[str] = None) -> BaselinePredictor:
        if model_type and model_type in self.model_catalog:
            return self.model_catalog[model_type]
        return self.predictor

    def get_anomaly_detector(self) -> AnomalyDetector:
        return self.anomaly_detector

    def get_confidence_estimator(self) -> ConfidenceEstimator:
        return self.confidence_estimator

    def set_active_model(self, model_name: str):
        if model_name in self.model_catalog:
            self.predictor = self.model_catalog[model_name]
            self.active_model_name = model_name
            logger.info(f"Active predictor switched to: {model_name}")

    def update_historical_accuracy(self, new_accuracy: float):
        self.historical_accuracy = round(max(0.1, min(1.0, new_accuracy)), 4)


# Global singleton instance
registry = ModelRegistry()
