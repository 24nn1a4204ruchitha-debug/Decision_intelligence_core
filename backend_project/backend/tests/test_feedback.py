def test_feedback_and_performance(client):
    # 1. Create a decision first
    dec_resp = client.post("/api/decision/evaluate", json={
        "data": {"temperature": 65.0, "pressure": 30.0, "vibration": 4.0, "energy_usage": 250.0, "humidity": 45.0}
    })
    decision_id = dec_resp.json()["decision_id"]

    # 2. Submit feedback
    fb_resp = client.post("/api/feedback", json={
        "decision_id": decision_id,
        "actual_outcome": "OPTIMAL_CONFIRMED",
        "correctness": 1.0,
        "human_feedback": "Turbine operated without issue for next 24 hours."
    })
    assert fb_resp.status_code == 201
    fb_data = fb_resp.json()
    assert fb_data["actual_outcome"] == "OPTIMAL_CONFIRMED"
    assert fb_data["correctness"] == 1.0

    # 3. Check model performance endpoint
    perf_resp = client.get("/api/model/performance")
    assert perf_resp.status_code == 200
    perf_data = perf_resp.json()
    assert "accuracy" in perf_data
    assert "total_feedbacks_recorded" in perf_data
    assert perf_data["total_feedbacks_recorded"] >= 1

    # 4. Trigger model retrain
    retrain_resp = client.post("/api/model/retrain", json={})
    assert retrain_resp.status_code == 200
    retrain_data = retrain_resp.json()
    assert retrain_data["status"] == "SUCCESS"
    assert "new_model_version" in retrain_data
