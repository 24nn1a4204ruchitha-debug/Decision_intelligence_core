import asyncio
import json
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.config import settings
from app.models.decision import Decision
from app.models.human_review import HumanReview
from app.models.audit_log import AuditLog
from app.models.data_record import DataRecord
from app.services.prediction_service import PredictionService
from app.services.anomaly_service import AnomalyService
from app.services.confidence_service import ConfidenceService
from app.services.explanation_service import ExplanationService
from app.services.websocket_manager import ws_manager
from app.utils.validators import assess_sensor_data_quality
from app.utils.logger import get_logger

logger = get_logger("services.decision_engine")


def _sanitize_for_json(obj: Any) -> Any:
    """Helper to convert datetimes and non-serializable types to plain json-serializable dicts/strings."""
    return json.loads(json.dumps(obj, default=str))


class DecisionEngine:
    """
    Central AI Decision Engine integrating Predictions, Anomalies, Confidence,
    Business Rules, Safety Guardrails, and Human-in-the-Loop Orchestration.
    """

    @staticmethod
    def _assess_risk_level(
        prediction_label: str,
        anomaly_severity: str,
        confidence_score: float,
        data_quality_score: float,
        anomaly_score: float
    ) -> Tuple[str, List[str]]:
        """
        Evaluate operational risk level and document specific risk triggers.
        """
        reasons = []
        if prediction_label == "CRITICAL_FAILURE_RISK" or anomaly_severity == "CRITICAL" or anomaly_score >= 0.85:
            risk = "CRITICAL"
            reasons.append("Critical failure probability or severe multivariate anomaly detected.")
        elif prediction_label == "MAINTENANCE_REQUIRED" or anomaly_severity == "HIGH" or data_quality_score < 0.60:
            risk = "HIGH"
            reasons.append("Elevated equipment wear or significant data degradation detected.")
        elif anomaly_severity == "MEDIUM" or confidence_score < settings.CONFIDENCE_THRESHOLD_AUTONOMOUS or data_quality_score < 0.85:
            risk = "MEDIUM"
            reasons.append("Moderate parameter variation or sub-optimal data quality observed.")
        else:
            risk = "LOW"
            reasons.append("Operational telemetry is stable within nominal baseline safety limits.")

        return risk, reasons

    @staticmethod
    def _determine_action(
        risk_level: str,
        confidence_score: float,
        prediction_label: str,
        force_human_review: bool
    ) -> Tuple[str, str, bool, bool, str]:
        """
        Determine decision status, action, autonomous execution flag, and review requirement.
        Returns:
            (decision, recommended_action, requires_human_review, executed_autonomously, status)
        """
        if force_human_review:
            return "REQUEST_HUMAN_REVIEW", "HUMAN_OPERATOR_VERIFICATION", True, False, "PENDING_REVIEW"

        # Guardrail 1: Critical Risk Decisions must NEVER execute autonomously without human verification
        if risk_level == "CRITICAL":
            return "ESCALATE", "EMERGENCY_SHUTDOWN_RECOMMENDED", True, False, "PENDING_REVIEW"

        # Guardrail 2: High Risk or Low Confidence decisions must be reviewed
        if risk_level == "HIGH" or confidence_score < settings.CONFIDENCE_THRESHOLD_AUTONOMOUS:
            return "REQUEST_HUMAN_REVIEW", "SCHEDULE_FIELD_INSPECTION", True, False, "PENDING_REVIEW"

        # Medium Risk -> Autonomous Monitoring Adjustment
        if risk_level == "MEDIUM":
            return "MONITOR", "INCREASE_TELEMETRY_SAMPLING_RATE", False, True, "EXECUTED"

        # Low Risk & High Confidence -> Fully Autonomous Nominal Action
        return "APPROVE", "MAINTAIN_NOMINAL_OPERATION", False, True, "EXECUTED"

    @classmethod
    def evaluate(
        cls,
        db: Session,
        data: Dict[str, Any],
        data_record_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        risk_tolerance: str = "STANDARD",
        force_human_review: bool = False,
        actor: str = "SYSTEM"
    ) -> Dict[str, Any]:
        """
        Execute complete decision intelligence pipeline:
        Data Analysis -> ML Prediction -> Anomaly Detection -> Uncertainty Estimation ->
        Guardrail Evaluation -> XAI Explanation -> Database Recording -> Audit Trail -> Real-time Broadcast.
        """
        # 1. Inspect data quality & missing attributes
        quality_score, missing_fields, corruption_flag, _ = assess_sensor_data_quality(data)
        missing_ratio = len(missing_fields) / 5.0

        # 2. Run ML Prediction
        pred_result = PredictionService.run_prediction(db, data, data_record_id=data_record_id, context=context)

        # 3. Run Anomaly Detection
        anomaly_result = AnomalyService.detect_anomaly(db, data, data_record_id=data_record_id)

        # 4. Run Multi-Factor Confidence & Uncertainty Estimation
        conf_result = ConfidenceService.estimate_confidence(
            model_probability=pred_result["probability"],
            data_quality_score=quality_score,
            missing_ratio=missing_ratio,
            anomaly_score=anomaly_result["anomaly_score"],
            input_timestamp=datetime.now(timezone.utc)
        )

        # 5. Assess Risk Level & Triggers
        risk_level, risk_reasons = cls._assess_risk_level(
            prediction_label=pred_result["prediction"],
            anomaly_severity=anomaly_result["severity"],
            confidence_score=conf_result["confidence_score"],
            data_quality_score=quality_score,
            anomaly_score=anomaly_result["anomaly_score"]
        )

        # 6. Apply Decision Rules & Safety Guardrails
        decision, action, req_human_review, exec_autonomous, status = cls._determine_action(
            risk_level=risk_level,
            confidence_score=conf_result["confidence_score"],
            prediction_label=pred_result["prediction"],
            force_human_review=force_human_review
        )

        # 7. Generate Explainable AI Structured Breakdown & Natural Language Narrative
        explanation_points = ExplanationService.generate_explanation_points(
            decision=decision,
            recommended_action=action,
            risk_level=risk_level,
            confidence_info=conf_result,
            prediction_info=pred_result,
            anomaly_info=anomaly_result,
            data_quality_score=quality_score,
            missing_fields=missing_fields
        )
        nl_explanation = ExplanationService.generate_natural_language_explanation(
            structured_points=explanation_points,
            decision=decision,
            risk_level=risk_level,
            confidence_score=conf_result["confidence_score"]
        )

        # 8. Persist Decision Record
        db_decision = Decision(
            data_record_id=data_record_id,
            prediction_id=pred_result.get("prediction_id"),
            anomaly_id=anomaly_result.get("anomaly_id"),
            decision=decision,
            recommended_action=action,
            risk_level=risk_level,
            confidence_score=conf_result["confidence_score"],
            uncertainty_score=conf_result["uncertainty_score"],
            reliability_level=conf_result["reliability"],
            requires_human_review=req_human_review,
            reasons=risk_reasons,
            explanation=explanation_points,
            nl_explanation=nl_explanation,
            executed_autonomously=exec_autonomous,
            status=status,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(db_decision)
        db.commit()
        db.refresh(db_decision)

        # 9. If Human Review Required, create HumanReview pending item with JSON-sanitized snapshot
        if req_human_review:
            review_item = HumanReview(
                decision_id=db_decision.id,
                original_decision=decision,
                modified_action=action,
                review_status="PENDING",
                snapshot=_sanitize_for_json({
                    "data": data,
                    "prediction": pred_result,
                    "anomaly": anomaly_result,
                    "confidence": conf_result,
                    "explanation": explanation_points,
                    "nl_explanation": nl_explanation,
                    "risk_level": risk_level,
                    "reasons": risk_reasons
                }),
                created_at=datetime.now(timezone.utc)
            )
            db.add(review_item)
            db.commit()

        # 10. Write to Immutable Decision Audit Trail
        audit_log = AuditLog(
            decision_id=db_decision.id,
            data_record_id=data_record_id,
            actor=actor,
            event_type="DECISION_EVALUATED",
            prediction=pred_result["prediction"],
            confidence_score=conf_result["confidence_score"],
            anomaly_score=anomaly_result["anomaly_score"],
            decision=decision,
            action_taken=action if exec_autonomous else "AWAITING_HUMAN_APPROVAL",
            human_intervention=req_human_review,
            explanation_summary=nl_explanation,
            final_outcome="AUTONOMOUS_EXECUTION" if exec_autonomous else "PENDING_HUMAN_REVIEW",
            snapshot_details=_sanitize_for_json({"risk_level": risk_level, "reasons": risk_reasons, "data_quality": quality_score}),
            timestamp=datetime.now(timezone.utc)
        )
        db.add(audit_log)
        db.commit()

        # 11. Broadcast Real-Time WebSocket Event
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(ws_manager.broadcast("DECISION_GENERATED", {
                    "decision_id": db_decision.id,
                    "decision": decision,
                    "action": action,
                    "risk_level": risk_level,
                    "confidence_score": conf_result["confidence_score"],
                    "requires_human_review": req_human_review,
                    "status": status
                }))
                if req_human_review:
                    asyncio.create_task(ws_manager.broadcast("HUMAN_REVIEW_REQUESTED", {
                        "decision_id": db_decision.id,
                        "risk_level": risk_level,
                        "reasons": risk_reasons
                    }))
                if anomaly_result["anomaly_detected"]:
                    asyncio.create_task(ws_manager.broadcast("ANOMALY_DETECTED", {
                        "anomaly_id": anomaly_result.get("anomaly_id"),
                        "severity": anomaly_result["severity"],
                        "score": anomaly_result["anomaly_score"]
                    }))
        except Exception as e:
            logger.debug(f"Async broadcast task creation deferred: {e}")

        return {
            "decision_id": db_decision.id,
            "decision": decision,
            "recommended_action": action,
            "risk_level": risk_level,
            "confidence_score": conf_result["confidence_score"],
            "uncertainty_score": conf_result["uncertainty_score"],
            "reliability": conf_result["reliability"],
            "requires_human_review": req_human_review,
            "executed_autonomously": exec_autonomous,
            "status": status,
            "explanation": explanation_points,
            "nl_explanation": nl_explanation,
            "reasons": risk_reasons,
            "prediction_summary": pred_result,
            "anomaly_summary": anomaly_result,
            "confidence_details": conf_result,
            "timestamp": db_decision.timestamp
        }
