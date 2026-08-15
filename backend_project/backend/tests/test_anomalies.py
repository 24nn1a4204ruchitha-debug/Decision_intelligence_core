def test_anomaly_detect_nominal(client):
    resp = client.post("/api/anomaly/detect", json={
        "data": {
            "temperature": 65.0,
            "pressure": 30.0,
            "vibration": 4.0,
            "energy_usage": 250.0,
            "humidity": 45.0
        }
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["anomaly_detected"] is False
    assert data["severity"] == "LOW"
    assert data["anomaly_score"] < 0.60


def test_anomaly_detect_spike(client):
    resp = client.post("/api/anomaly/detect", json={
        "data": {
            "temperature": 135.0,  # Huge spike
            "pressure": 80.0,      # Huge spike
            "vibration": 35.0,     # Huge spike
            "energy_usage": 600.0,
            "humidity": 90.0
        }
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["anomaly_detected"] is True
    assert data["severity"] in ("HIGH", "CRITICAL")
    assert len(data["affected_features"]) > 0


def test_query_anomalies(client):
    # Detect one anomaly to ensure at least one exists in DB
    client.post("/api/anomaly/detect", json={
        "data": {"temperature": 150.0, "pressure": 90.0, "vibration": 40.0, "energy_usage": 700.0, "humidity": 95.0}
    })
    resp = client.get("/api/anomalies")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
