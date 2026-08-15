def test_human_review_workflow(client, reviewer_headers):
    # 1. Trigger a decision that requires review
    dec_resp = client.post("/api/decision/evaluate", json={
        "data": {
            "temperature": 125.0,
            "pressure": 65.0,
            "vibration": 25.0,
            "energy_usage": 500.0,
            "humidity": 80.0
        }
    })
    assert dec_resp.status_code == 200
    dec_data = dec_resp.json()
    assert dec_data["requires_human_review"] is True
    decision_id = dec_data["decision_id"]

    # 2. Query pending reviews
    pending_resp = client.get("/api/reviews/pending", headers=reviewer_headers)
    assert pending_resp.status_code == 200
    pending_list = pending_resp.json()
    assert len(pending_list) > 0
    assert any(p["decision_id"] == decision_id for p in pending_list)

    # 3. Approve the decision
    approve_resp = client.post(
        f"/api/reviews/{decision_id}/approve",
        json={"reason": "Operator confirmed inspection schedule with on-site technician."},
        headers=reviewer_headers
    )
    assert approve_resp.status_code == 200
    appr_data = approve_resp.json()
    assert appr_data["review_status"] == "APPROVED"
    assert appr_data["human_decision"] == "APPROVE"


def test_human_review_modify(client, reviewer_headers):
    # Trigger high risk decision
    dec_resp = client.post("/api/decision/evaluate", json={
        "data": {"temperature": 110.0, "pressure": 55.0, "vibration": 20.0, "energy_usage": 450.0, "humidity": 75.0}
    })
    decision_id = dec_resp.json()["decision_id"]

    # Modify decision action
    modify_resp = client.post(
        f"/api/reviews/{decision_id}/modify",
        json={
            "reason": "Adjusted cooling subsystem before full dispatch.",
            "modified_action": "ACTIVATE_AUXILIARY_COOLING_CYCLE"
        },
        headers=reviewer_headers
    )
    assert modify_resp.status_code == 200
    mod_data = modify_resp.json()
    assert mod_data["review_status"] == "MODIFIED"
    assert mod_data["final_action"] == "ACTIVATE_AUXILIARY_COOLING_CYCLE"
