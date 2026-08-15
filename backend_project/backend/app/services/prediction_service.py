from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.prediction import Prediction
from app.ml.model_registry import registry
from app.utils.logger import get_logger

logger = get_logger("services.prediction")


class PredictionService:
    """
    Service orchestrating ML predictions and persisting prediction history.
    """

    @staticmethod
    def run_prediction(
        db: Optional[Session],
        data: Dict[str, Any],
        model_type: str = "RandomForestClassifier",
        data_record_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute prediction with active or selected model, persist result, and return response dict.
        """
        predictor = registry.get_predictor(model_type)
        pred_result = predictor.predict(data)

        prediction_id = None
        if db is not None:
            db_prediction = Prediction(
                data_record_id=data_record_id,
                model_type=pred_result["model_type"],
                model_version=pred_result["model_version"],
                prediction=pred_result["prediction"],
                probability=pred_result["probability"],
                class_probabilities=pred_result["class_probabilities"],
                confidence_score=pred_result["confidence_score"],
                important_features=pred_result["important_features"],
                raw_input_snapshot=data,
                timestamp=pred_result["timestamp"]
            )
            db.add(db_prediction)
            db.commit()
            db.refresh(db_prediction)
            prediction_id = db_prediction.id

        return {
            "prediction_id": prediction_id,
            "prediction": pred_result["prediction"],
            "probability": pred_result["probability"],
            "confidence_score": pred_result["confidence_score"],
            "model_version": pred_result["model_version"],
            "model_type": pred_result["model_type"],
            "important_features": pred_result["important_features"],
            "class_probabilities": pred_result["class_probabilities"],
            "timestamp": pred_result["timestamp"]
        }
