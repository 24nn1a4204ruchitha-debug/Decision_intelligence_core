def test_predict_nominal(client):
    payload = {
        "data": {
            "temperature": 65.0,
            "pressure": 30.0,
            "vibration": 4.0,
            "energy_usage": 250.0,
            "humidity": 45.0
        }
    }
    resp = client.post("/api/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["prediction"] == "OPTIMAL"
    assert data["probability"] >= 0.5
    assert "temperature" in data["important_features"]
    assert "model_version" in data


def test_predict_critical_condition(client):
    payload = {
        "data": {
            "temperature": 120.0,
            "pressure": 70.0,
            "vibration": 30.0,
            "energy_usage": 550.0,
            "humidity": 85.0
        }
    }
    resp = client.post("/api/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["prediction"] in ("CRITICAL_FAILURE_RISK", "MAINTENANCE_REQUIRED")
