import httpx
from typing import Dict, Any, List, Optional
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("services.explanation")


class ExplanationService:
    """
    Explainable AI (XAI) service producing structured 6-point transparency breakdowns
    and optional LLM-synthesized natural language narratives.
    """

    @staticmethod
    def generate_explanation_points(
        decision: str,
        recommended_action: str,
        risk_level: str,
        confidence_info: Dict[str, Any],
        prediction_info: Dict[str, Any],
        anomaly_info: Dict[str, Any],
        data_quality_score: float,
        missing_fields: List[str]
    ) -> List[str]:
        """
        Produce deterministic 6-point structured explanation.
        """
        conf_score = confidence_info.get("confidence_score", 0.0)
        reliability = confidence_info.get("reliability", "UNKNOWN")
        pred_label = prediction_info.get("prediction", "UNKNOWN")
        anomaly_detected = anomaly_info.get("anomaly_detected", False)
        anomaly_severity = anomaly_info.get("severity", "LOW")
        affected_feats = anomaly_info.get("affected_features", [])

        points = []

        # Point 1: What decision was made?
        points.append(f"Decision '{decision}' was determined with recommended action: '{recommended_action}' (Risk Level: {risk_level}).")

        # Point 2: Why was it made?
        if decision in ("APPROVE", "MONITOR") and not anomaly_detected:
            points.append(f"Telemetry conforms to standard nominal parameters with predicted condition '{pred_label}'.")
        elif decision in ("ESCALATE", "REQUEST_HUMAN_REVIEW"):
            triggers = []
            if anomaly_detected:
                triggers.append(f"active {anomaly_severity} anomaly detection")
            if conf_score < settings.CONFIDENCE_THRESHOLD_AUTONOMOUS:
                triggers.append(f"confidence score ({conf_score:.2f}) below autonomous threshold ({settings.CONFIDENCE_THRESHOLD_AUTONOMOUS:.2f})")
            if risk_level in ("HIGH", "CRITICAL"):
                triggers.append(f"high operational risk classification ({risk_level})")
            triggers_str = " and ".join(triggers) if triggers else "safety guardrail triggers"
            points.append(f"Action requires escalation/human review due to {triggers_str}.")
        else:
            points.append(f"Decision was evaluated based on operational state '{pred_label}' and risk profile '{risk_level}'.")

        # Point 3: Which input factors influenced it?
        top_features = prediction_info.get("important_features", {})
        sorted_feats = sorted(top_features.items(), key=lambda x: x[1], reverse=True)[:3]
        if sorted_feats:
            feats_str = ", ".join([f"{k} (weight: {v:.2f})" for k, v in sorted_feats])
            points.append(f"Key predictive feature drivers: {feats_str}.")
        else:
            points.append("Input telemetry across all standard sensor channels contributed equally to the assessment.")

        # Point 4: What anomalies were detected?
        if anomaly_detected:
            aff_str = ", ".join(affected_feats) if affected_feats else "multivariate variance"
            points.append(f"Anomaly detected with score {anomaly_info.get('anomaly_score', 0.0):.2f} ({anomaly_severity} severity). Affected parameters: {aff_str}.")
        else:
            points.append("No statistical anomalies detected; sensor readings remain within baseline standard deviations.")

        # Point 5: How confident is the system?
        points.append(f"System confidence is {conf_score * 100:.1f}% with reliability classified as '{reliability}' (uncertainty: {confidence_info.get('uncertainty_score', 0.0) * 100:.1f}%).")

        # Point 6: Why might the prediction be unreliable / risk caveats?
        caveats = []
        if data_quality_score < 0.90:
            caveats.append(f"input data quality is {data_quality_score * 100:.0f}%")
        if missing_fields:
            caveats.append(f"missing fields were statistically imputed: {', '.join(missing_fields)}")
        if reliability in ("LOW", "UNRELIABLE"):
            caveats.append("high epistemic uncertainty detected across feature distributions")
        
        if caveats:
            points.append(f"Potential unreliability factors: {'; '.join(caveats)}.")
        else:
            points.append("Data quality is optimal (100%) with no missing or corrupted inputs.")

        return points

    @staticmethod
    def generate_natural_language_explanation(
        structured_points: List[str],
        decision: str,
        risk_level: str,
        confidence_score: float
    ) -> str:
        """
        Generate natural language summary. Uses external LLM if configured, otherwise falls back to crisp deterministic synthesis.
        """
        # Check if external LLM configured
        if settings.LLM_PROVIDER in ("openai", "gemini", "ollama") and settings.LLM_API_KEY:
            try:
                headers = {"Authorization": f"Bearer {settings.LLM_API_KEY}"}
                prompt = (
                    f"You are an Explainable AI assistant for an industrial decision intelligence platform. "
                    f"Synthesize the following technical explanation points into a crisp, professional 2-paragraph summary:\n\n"
                    + "\n".join(f"- {p}" for p in structured_points)
                )
                payload = {
                    "model": settings.LLM_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2
                }
                with httpx.Client(timeout=3.0) as client:
                    resp = client.post(f"{settings.LLM_BASE_URL}/chat/completions", json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"].strip()
            except Exception as e:
                logger.warning(f"LLM API call skipped or timed out ({e}). Using deterministic fallback.")

        # Deterministic crisp synthesis fallback
        summary = (
            f"The system rendered a {decision} decision with a risk level of {risk_level} "
            f"and a confidence rating of {confidence_score * 100:.1f}%. "
            f"{structured_points[1]} {structured_points[3]} {structured_points[4]}"
        )
        return summary
