import io
from PIL import Image


def test_ingest_sensor_nominal(client):
    payload = {
        "source": "turbine_sensor_stream",
        "temperature": 65.4,
        "pressure": 30.2,
        "vibration": 4.1,
        "energy_usage": 245.0,
        "humidity": 45.0,
        "machine_id": "TURBINE_01"
    }
    resp = client.post("/api/data/sensor", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["quality_score"] == 1.0
    assert data["corruption_flag"] is False
    assert len(data["missing_fields"]) == 0
    assert data["processed_data"]["temperature"] == 65.4


def test_ingest_sensor_with_missing_and_out_of_bounds(client):
    payload = {
        "source": "degraded_sensor_stream",
        "temperature": None,  # Missing
        "pressure": 9999.0,   # Out of bounds (> 100)
        "vibration": 4.1,
        "energy_usage": None, # Missing
        "humidity": 45.0
    }
    resp = client.post("/api/data/sensor", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["quality_score"] < 1.0
    assert "temperature" in data["missing_fields"]
    assert "energy_usage" in data["missing_fields"]
    assert data["corruption_flag"] is True
    # Verify safe statistical imputation occurred
    assert data["processed_data"]["temperature"] is not None
    assert "temperature" in data["imputed_fields"]


def test_ingest_text(client):
    payload = {
        "text": "Turbine Alpha report: temperature is 68.5 C and vibration level measured 4.3 mm/s under normal load.",
        "source": "operator_log"
    }
    resp = client.post("/api/data/text", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["data_type"] == "text"
    assert data["quality_score"] == 1.0
    assert data["processed_data"]["word_count"] > 0


def test_ingest_json(client):
    payload = {
        "payload": {"temperature": 70.0, "pressure": 31.0, "status": "active"},
        "source": "custom_iot_json"
    }
    resp = client.post("/api/data/json", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["data_type"] == "json"


def test_ingest_csv(client):
    csv_content = (
        "temperature,pressure,vibration,energy_usage,humidity\n"
        "65.0,30.0,4.0,250.0,45.0\n"
        "66.2,30.5,4.2,255.0,46.0\n"
    )
    files = {"file": ("test_telemetry.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    resp = client.post("/api/data/csv", files=files)
    assert resp.status_code == 201
    records = resp.json()
    assert len(records) == 2
    assert records[0]["quality_score"] == 1.0


def test_ingest_image(client):
    # Create simple in-memory test image
    img = Image.new("RGB", (64, 64), color="blue")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)

    files = {"file": ("inspection_photo.png", img_byte_arr, "image/png")}
    resp = client.post("/api/data/image", files=files, data={"source": "camera_feed"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["data_type"] == "image"
    assert "width" in data["processed_data"]
    assert data["processed_data"]["width"] == 64


def test_simulate_degradation_track01_hard_mode(client):
    resp = client.post("/api/data/simulate-degradation", json={
        "missing_percentage": 0.30,
        "corrupted_percentage": 0.10
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["percentage_missing"] == 0.30
    assert len(data["affected_fields"]) > 0
    assert "fallback_strategy" in data
    assert "imputed_values" in data
