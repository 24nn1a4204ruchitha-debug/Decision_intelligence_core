def test_full_end_to_end_decision_intelligence_pipeline(client, reviewer_headers):
    """
    Complete End-to-End Pipeline Verification:
    DATA INGESTION
    → DATA VALIDATION & IMPUTATION
    → PREDICTION
    → ANOMALY DETECTION
    → MULTI-FACTOR CONFIDENCE & UNCERTAINTY
    → CENTRAL DECISION ENGINE (GUARDRAILS & XAI)
    → HUMAN-IN-THE-LOOP INTERVENTION
    → AUDIT TRAIL RECORDING
    → FEEDBACK COLLECTION
    → MODEL ADAPTATION / RETRAINING
    → DASHBOARD KPI REFRESH
    """

    # 1. Multimodal Data Ingestion (Telemetry with high vibration & elevated temperature)
    sensor_payload = {
        "source": "industrial_generator_turbine_04",
        "temperature": 115.8,
        "pressure": 48.2,
        "vibration": 22.5,
        "energy_usage": 390.0,
        "humidity": 68.0,
        "machine_id": "TURBINE_GEN_04"
    }
    ingest_resp = client.post("/api/data/sensor", json=sensor_payload)
    assert ingest_resp.status_code == 201
    ingested_record = ingest_resp.json()
    record_id = ingested_record["id"]
    assert ingested_record["quality_score"] > 0.0

    # 2. Prediction Step
    pred_resp = client.post("/api/predict", json={
        "data": ingested_record["processed_data"],
        "data_record_id": record_id
    })
    assert pred_resp.status_code == 200
    pred_data = pred_resp.json()
    assert pred_data["prediction"] in ("MAINTENANCE_REQUIRED", "CRITICAL_FAILURE_RISK")
    assert "temperature" in pred_data["important_features"]

    # 3. Anomaly Detection Step
    anom_resp = client.post("/api/anomaly/detect", json={
        "data": ingested_record["processed_data"],
        "data_record_id": record_id
    })
    assert anom_resp.status_code == 200
    anom_data = anom_resp.json()
    assert anom_data["anomaly_detected"] is True
    assert anom_data["severity"] in ("MEDIUM", "HIGH", "CRITICAL")

    # 4. Central Decision Engine Evaluation (With Guardrails & 6-Point XAI Explanation)
    decision_resp = client.post("/api/decision/evaluate", json={
        "data": ingested_record["processed_data"],
        "data_record_id": record_id,
        "context": {"machine_id": "TURBINE_GEN_04", "site": "Sector-B"}
    })
    assert decision_resp.status_code == 200
    decision_data = decision_resp.json()
    decision_id = decision_data["decision_id"]
    
    # Assert guardrails kicked in due to elevated anomaly and risk
    assert decision_data["requires_human_review"] is True
    assert decision_data["executed_autonomously"] is False
    assert decision_data["risk_level"] in ("HIGH", "CRITICAL", "MEDIUM")
    assert len(decision_data["explanation"]) >= 5
    assert decision_data["confidence_details"] is not None

    # 5. Human-in-the-Loop Review
    pending_resp = client.get("/api/reviews/pending", headers=reviewer_headers)
    assert pending_resp.status_code == 200
    pending_items = pending_resp.json()
    matching_review = next((item for item in pending_items if item["decision_id"] == decision_id), None)
    assert matching_review is not None

    # Human Reviewer Approves / Executes the action
    review_resp = client.post(
        f"/api/reviews/{decision_id}/approve",
        json={"reason": "Safety officer approved dispatch based on XAI vibration breakdown."},
        headers=reviewer_headers
    )
    assert review_resp.status_code == 200
    review_data = review_resp.json()
    assert review_data["review_status"] == "APPROVED"

    # 6. Collect Ground Truth Feedback
    feedback_resp = client.post("/api/feedback", json={
        "decision_id": decision_id,
        "actual_outcome": "BEARING_WEAR_CONFIRMED_PREVENTED_SHUTDOWN",
        "correctness": 1.0,
        "human_feedback": "Dispatch team replaced worn bearing assembly before catastrophic breakdown."
    })
    assert feedback_resp.status_code == 201
    assert feedback_resp.json()["correctness"] == 1.0

    # 7. Adaptive Model Retraining
    retrain_resp = client.post("/api/model/retrain", json={})
    assert retrain_resp.status_code == 200
    retrain_data = retrain_resp.json()
    assert retrain_data["status"] == "SUCCESS"

    # 8. Decision Audit Trail Verification
    audit_resp = client.get(f"/api/audit/{decision_id}")
    assert audit_resp.status_code == 200
    audit_trail = audit_resp.json()
    assert len(audit_trail) >= 2  # DECISION_EVALUATED, HUMAN_REVIEW_APPROVE, FEEDBACK_RECORDED
    event_types = [a["event_type"] for a in audit_trail]
    assert "DECISION_EVALUATED" in event_types
    assert "HUMAN_REVIEW_APPROVE" in event_types

    # 9. Dashboard KPIs reflect full cycle
    overview_resp = client.get("/api/dashboard/overview")
    assert overview_resp.status_code == 200
    overview_data = overview_resp.json()
    assert overview_data["total_decisions"] >= 1
    assert overview_data["human_reviewed_decisions"] >= 1
