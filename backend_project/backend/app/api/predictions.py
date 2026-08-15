from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.prediction import PredictRequest, PredictResponse
from app.services.prediction_service import PredictionService
from app.utils.logger import get_logger

logger = get_logger("api.predictions")
router = APIRouter(prefix="/predict", tags=["Prediction Engine"])


@router.post("", response_model=PredictResponse)
def generate_prediction(req: PredictRequest, db: Session = Depends(get_db)):
    """
    Generate ML prediction and feature importance rankings on input data.
    """
    result = PredictionService.run_prediction(
        db=db,
        data=req.data,
        model_type=req.model_type or "RandomForestClassifier",
        data_record_id=req.data_record_id,
        context=req.context
    )
    return result
