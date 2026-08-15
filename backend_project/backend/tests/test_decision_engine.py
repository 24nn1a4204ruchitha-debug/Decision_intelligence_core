def test_decision_evaluate_nominal_autonomous(client):
    payload = {
        "data": {
            "temperature": 65.0,
            "pressure": 30.0,
            "vibration": 4.0,
            "energy_usage": 250.0,
            "humidity": 45.0
        }
    }
    resp = client.post("/api/decision/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "APPROVE"
    assert data["executed_autonomously"] is True
    assert data["requires_human_review"] is False
    assert data["risk_level"] == "LOW"
    assert len(data["explanation"]) >= 5


def test_decision_evaluate_critical_risk_escalation(client):
    payload = {
        "data": {
            "temperature": 140.0,
            "pressure": 85.0,
            "vibration": 38.0,
            "energy_usage": 650.0,
            "humidity": 90.0
        }
    }
    resp = client.post("/api/decision/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "ESCALATE"
    assert data["requires_human_review"] is True
    assert data["executed_autonomously"] is False
    assert data["risk_level"] == "CRITICAL"


def test_decision_evaluate_force_human_review(client):
    payload = {
        "data": {
            "temperature": 65.0,
            "pressure": 30.0,
            "vibration": 4.0,
            "energy_usage": 250.0,
            "humidity": 45.0
        },
        "force_human_review": True
    }
    resp = client.post("/api/decision/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "REQUEST_HUMAN_REVIEW"
    assert data["requires_human_review"] is True
