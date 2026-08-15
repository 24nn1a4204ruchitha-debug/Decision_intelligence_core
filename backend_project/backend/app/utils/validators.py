import math
from typing import Dict, Any, List, Tuple
from fastapi import HTTPException, UploadFile

# Sensor operational range definitions (for default industrial scenario)
SENSOR_BOUNDS = {
    "temperature": (-40.0, 200.0),    # Celsius
    "pressure": (0.0, 100.0),          # Bar / PSI
    "vibration": (0.0, 50.0),          # mm/s
    "energy_usage": (0.0, 1000.0),     # kW
    "humidity": (0.0, 100.0),          # %
}

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def validate_file_upload(file: UploadFile, allowed_extensions: set, max_size: int = MAX_FILE_SIZE_BYTES):
    """
    Validate uploaded file extension and content type.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload")
    
    import os
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{ext}'. Allowed: {list(allowed_extensions)}"
        )


def assess_sensor_data_quality(payload: Dict[str, Any], expected_fields: List[str] = None) -> Tuple[float, List[str], bool, Dict[str, Any]]:
    """
    Assess quality of an ingested sensor payload.
    Returns:
      - quality_score (0.0 to 1.0)
      - missing_fields (list of str)
      - corruption_flag (bool)
      - cleaned_data (dict with safe numbers or flags)
    """
    if expected_fields is None:
        expected_fields = ["temperature", "pressure", "vibration", "energy_usage", "humidity"]
    
    missing_fields = []
    corrupted_fields = []
    cleaned_data = {}
    
    for field in expected_fields:
        if field not in payload or payload[field] is None:
            missing_fields.append(field)
            cleaned_data[field] = None
            continue
        
        val = payload[field]
        # Check if value can be converted to float
        try:
            val_float = float(val)
            if math.isnan(val_float) or math.isinf(val_float):
                corrupted_fields.append(f"{field}:nan_or_inf")
                cleaned_data[field] = None
            else:
                # Check sensor operational boundary bounds
                if field in SENSOR_BOUNDS:
                    min_b, max_b = SENSOR_BOUNDS[field]
                    if val_float < min_b or val_float > max_b:
                        corrupted_fields.append(f"{field}:out_of_bounds({val_float})")
                cleaned_data[field] = val_float
        except (ValueError, TypeError):
            corrupted_fields.append(f"{field}:invalid_type")
            cleaned_data[field] = None

    total_expected = len(expected_fields)
    missing_penalty = (len(missing_fields) / total_expected) * 0.5
    corrupted_penalty = (len(corrupted_fields) / total_expected) * 0.5
    
    raw_quality = 1.0 - (missing_penalty + corrupted_penalty)
    quality_score = max(0.0, min(1.0, round(raw_quality, 4)))
    corruption_flag = len(corrupted_fields) > 0

    return quality_score, missing_fields, corruption_flag, cleaned_data
