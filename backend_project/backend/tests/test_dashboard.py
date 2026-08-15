def test_dashboard_overview_and_health(client):
    # Ensure some data exists
    client.post("/api/decision/evaluate", json={
        "data": {"temperature": 65.0, "pressure": 30.0, "vibration": 4.0, "energy_usage": 250.0, "humidity": 45.0}
    })

    # Overview KPIs
    overview_resp = client.get("/api/dashboard/overview")
    assert overview_resp.status_code == 200
    ov_data = overview_resp.json()
    assert "total_decisions" in ov_data
    assert "average_confidence" in ov_data
    assert "reliability_distribution" in ov_data

    # Recent decisions
    rec_resp = client.get("/api/dashboard/recent-decisions")
    assert rec_resp.status_code == 200
    assert isinstance(rec_resp.json(), list)

    # Recent anomalies
    anom_resp = client.get("/api/dashboard/recent-anomalies")
    assert anom_resp.status_code == 200
    assert isinstance(anom_resp.json(), list)

    # System health
    health_resp = client.get("/api/dashboard/system-health")
    assert health_resp.status_code == 200
    health_data = health_resp.json()
    assert health_data["status"] == "HEALTHY"
    assert health_data["database_connected"] is True
