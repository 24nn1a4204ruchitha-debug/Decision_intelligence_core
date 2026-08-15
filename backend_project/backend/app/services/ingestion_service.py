import os
import uuid
import math
import random
import pandas as pd
from io import BytesIO, StringIO
from PIL import Image, ImageStat
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.config import settings
from app.models.data_record import DataRecord
from app.utils.validators import assess_sensor_data_quality, validate_file_upload, ALLOWED_IMAGE_EXTENSIONS
from app.utils.logger import get_logger

logger = get_logger("services.ingestion")

# Safe default values for imputation
DEFAULT_IMPUTATIONS = {
    "temperature": 65.0,
    "pressure": 30.0,
    "vibration": 4.0,
    "energy_usage": 250.0,
    "humidity": 45.0
}


class IngestionService:
    """
    Multimodal data ingestion, validation, normalization, and degradation handling service.
    """

    @staticmethod
    def _apply_safe_imputation(cleaned_data: Dict[str, Any], missing_fields: List[str]) -> Tuple[Dict[str, Any], List[str]]:
        """
        Safely impute missing or corrupted numerical sensor values with domain nominal baselines.
        Tracks all imputed fields explicitly.
        """
        imputed_data = cleaned_data.copy()
        imputed_fields = []
        for field, default_val in DEFAULT_IMPUTATIONS.items():
            if field in missing_fields or imputed_data.get(field) is None:
                imputed_data[field] = default_val
                imputed_fields.append(field)
        return imputed_data, imputed_fields

    @staticmethod
    def ingest_sensor(db: Session, data: Dict[str, Any], source: str = "sensor_stream", metadata: Dict[str, Any] = None) -> DataRecord:
        """
        Ingest, validate, quality-score, and normalize IoT sensor telemetry.
        """
        quality_score, missing_fields, corruption_flag, cleaned_data = assess_sensor_data_quality(data)
        processed_data, imputed_fields = IngestionService._apply_safe_imputation(cleaned_data, missing_fields)
        
        # Include metadata tracking
        meta = metadata or {}
        meta["imputed_fields"] = imputed_fields
        meta["raw_field_count"] = len(data)

        record = DataRecord(
            source=source,
            data_type="sensor",
            raw_data=data,
            processed_data=processed_data,
            metadata_info=meta,
            quality_score=quality_score,
            missing_fields=missing_fields,
            corruption_flag=corruption_flag,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info(f"Ingested sensor record [{record.id}] | Quality: {quality_score:.2f} | Missing: {missing_fields}")
        return record

    @staticmethod
    def ingest_text(db: Session, text: str, source: str = "text_stream", metadata: Dict[str, Any] = None) -> DataRecord:
        """
        Ingest unstructured text, calculate character/word metrics and basic numerical token extraction.
        """
        words = text.split()
        char_count = len(text)
        word_count = len(words)
        quality_score = 1.0 if word_count > 0 else 0.0
        missing = ["text"] if word_count == 0 else []

        # Extract any numeric tokens that look like readings
        extracted_numbers = []
        for w in words:
            try:
                extracted_numbers.append(float(w.strip(",.;:()")))
            except ValueError:
                pass

        processed_data = {
            "text": text,
            "char_count": char_count,
            "word_count": word_count,
            "extracted_numbers": extracted_numbers[:10],
            # Synthesize standard features if numbers extracted, else defaults
            "temperature": extracted_numbers[0] if len(extracted_numbers) > 0 else DEFAULT_IMPUTATIONS["temperature"],
            "pressure": extracted_numbers[1] if len(extracted_numbers) > 1 else DEFAULT_IMPUTATIONS["pressure"],
            "vibration": extracted_numbers[2] if len(extracted_numbers) > 2 else DEFAULT_IMPUTATIONS["vibration"],
            "energy_usage": extracted_numbers[3] if len(extracted_numbers) > 3 else DEFAULT_IMPUTATIONS["energy_usage"],
            "humidity": extracted_numbers[4] if len(extracted_numbers) > 4 else DEFAULT_IMPUTATIONS["humidity"]
        }

        record = DataRecord(
            source=source,
            data_type="text",
            raw_data={"text": text},
            processed_data=processed_data,
            metadata_info=metadata or {},
            quality_score=quality_score,
            missing_fields=missing,
            corruption_flag=False,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def ingest_json(db: Session, payload: Dict[str, Any], source: str = "json_stream", metadata: Dict[str, Any] = None) -> DataRecord:
        """
        Ingest arbitrary JSON, score structure, normalize sensor properties if present.
        """
        quality_score, missing_fields, corruption_flag, cleaned_data = assess_sensor_data_quality(payload)
        processed_data, imputed_fields = IngestionService._apply_safe_imputation(cleaned_data, missing_fields)
        
        meta = metadata or {}
        meta["imputed_fields"] = imputed_fields

        record = DataRecord(
            source=source,
            data_type="json",
            raw_data=payload,
            processed_data=processed_data,
            metadata_info=meta,
            quality_score=quality_score,
            missing_fields=missing_fields,
            corruption_flag=corruption_flag,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def ingest_event(db: Session, event_type: str, payload: Dict[str, Any], severity: str = "INFO", source: str = "event_bus", metadata: Dict[str, Any] = None) -> DataRecord:
        """
        Ingest real-time application or external system event.
        """
        quality_score, missing_fields, corruption_flag, cleaned_data = assess_sensor_data_quality(payload)
        processed_data, imputed_fields = IngestionService._apply_safe_imputation(cleaned_data, missing_fields)
        
        meta = metadata or {}
        meta["event_type"] = event_type
        meta["severity"] = severity
        meta["imputed_fields"] = imputed_fields

        record = DataRecord(
            source=source,
            data_type="event",
            raw_data={"event_type": event_type, "severity": severity, "payload": payload},
            processed_data=processed_data,
            metadata_info=meta,
            quality_score=quality_score,
            missing_fields=missing_fields,
            corruption_flag=corruption_flag,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def ingest_csv_content(db: Session, file_content: bytes, filename: str, source: str = "csv_upload") -> List[DataRecord]:
        """
        Parse CSV content, validate rows, and ingest records in batch.
        """
        df = pd.read_csv(BytesIO(file_content))
        created_records = []

        for _, row in df.iterrows():
            row_dict = row.dropna().to_dict()
            quality_score, missing_fields, corruption_flag, cleaned_data = assess_sensor_data_quality(row_dict)
            processed_data, imputed_fields = IngestionService._apply_safe_imputation(cleaned_data, missing_fields)
            
            record = DataRecord(
                source=f"{source}:{filename}",
                data_type="csv",
                raw_data=row_dict,
                processed_data=processed_data,
                metadata_info={"filename": filename, "imputed_fields": imputed_fields},
                quality_score=quality_score,
                missing_fields=missing_fields,
                corruption_flag=corruption_flag,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(record)
            created_records.append(record)
        
        db.commit()
        for r in created_records:
            db.refresh(r)
        logger.info(f"Ingested {len(created_records)} records from CSV '{filename}'")
        return created_records

    @staticmethod
    def ingest_image_file(db: Session, file: UploadFile, source: str = "image_stream", metadata: Dict[str, Any] = None) -> DataRecord:
        """
        Ingest, validate, store image and extract visual features (brightness, color statistics, resolution).
        """
        validate_file_upload(file, ALLOWED_IMAGE_EXTENSIONS)
        file_id = uuid.uuid4().hex
        _, ext = os.path.splitext(file.filename)
        save_filename = f"{file_id}{ext}"
        save_path = os.path.join(settings.UPLOAD_DIR, save_filename)

        content = file.file.read()
        with open(save_path, "wb") as f:
            f.write(content)

        # Extract image features with Pillow
        img = Image.open(BytesIO(content))
        width, height = img.size
        stat = ImageStat.Stat(img)
        mean_rgb = stat.mean[:3] if len(stat.mean) >= 3 else [stat.mean[0]] * 3
        brightness = sum(mean_rgb) / 3.0

        # Synthesize numerical telemetry features mapped from visual attributes
        # (e.g. thermal camera brightness -> temperature estimation)
        processed_data = {
            "image_filename": save_filename,
            "width": width,
            "height": height,
            "format": img.format,
            "mode": img.mode,
            "brightness": round(brightness, 2),
            "mean_rgb": [round(c, 2) for c in mean_rgb],
            # Map visual attributes to industrial sensor baselines
            "temperature": round(20.0 + (brightness / 255.0) * 80.0, 2),
            "pressure": 30.0,
            "vibration": 4.0,
            "energy_usage": round(150.0 + (brightness / 255.0) * 200.0, 2),
            "humidity": 45.0
        }

        record = DataRecord(
            source=source,
            data_type="image",
            raw_data={"filename": file.filename, "file_path": save_path, "size_bytes": len(content)},
            processed_data=processed_data,
            metadata_info=metadata or {},
            quality_score=1.0,
            missing_fields=[],
            corruption_flag=False,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info(f"Ingested image [{record.id}] '{file.filename}' ({width}x{height})")
        return record

    @staticmethod
    def simulate_data_degradation(
        db: Session,
        missing_pct: float = 0.25,
        corrupted_pct: float = 0.10,
        base_payload: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Track 01 Hard Mode: Ingest and simulate resilient processing when 20-30% of data is missing/corrupted.
        """
        if base_payload is None:
            base_payload = {
                "temperature": 72.4,
                "pressure": 31.8,
                "vibration": 4.2,
                "energy_usage": 265.0,
                "humidity": 48.0
            }

        fields = list(base_payload.keys())
        degraded_payload = base_payload.copy()
        affected_fields = []

        # 1. Inject missing values
        n_missing = max(1, int(len(fields) * missing_pct))
        missing_selected = random.sample(fields, min(n_missing, len(fields)))
        for f in missing_selected:
            degraded_payload[f] = None
            affected_fields.append(f"{f}:missing")

        # 2. Inject corrupted/extreme values into non-missing fields
        available_fields = [f for f in fields if f not in missing_selected]
        n_corrupt = int(len(fields) * corrupted_pct)
        if available_fields and n_corrupt > 0:
            corrupt_selected = random.sample(available_fields, min(n_corrupt, len(available_fields)))
            for f in corrupt_selected:
                # Inject extreme out of range value or NaN
                degraded_payload[f] = 9999.0
                affected_fields.append(f"{f}:out_of_bounds_spike")

        # Ingest degraded payload through validation and safe imputation
        quality_score, missing_fields, corruption_flag, cleaned = assess_sensor_data_quality(degraded_payload)
        processed_data, imputed_fields = IngestionService._apply_safe_imputation(cleaned, missing_fields)

        record = DataRecord(
            source="simulation_degradation_stream",
            data_type="sensor",
            raw_data=degraded_payload,
            processed_data=processed_data,
            metadata_info={
                "simulation_mode": "Track01_HardMode_Degradation",
                "missing_pct": missing_pct,
                "corrupted_pct": corrupted_pct,
                "imputed_fields": imputed_fields
            },
            quality_score=quality_score,
            missing_fields=missing_fields,
            corruption_flag=corruption_flag,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        system_status = "RESILIENT_DEGRADED" if quality_score >= 0.50 else "CRITICAL_DEGRADATION"
        fallback_strategy = f"Applied safe statistical domain baselines for {len(imputed_fields)} fields: {', '.join(imputed_fields)}."

        return {
            "percentage_missing": missing_pct,
            "percentage_corrupted": corrupted_pct,
            "affected_fields": affected_fields,
            "original_quality_score": 1.0,
            "degraded_quality_score": quality_score,
            "system_status": system_status,
            "fallback_strategy": fallback_strategy,
            "imputed_values": {f: processed_data[f] for f in imputed_fields},
            "degraded_payload": degraded_payload,
            "data_record_id": record.id
        }
