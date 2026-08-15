def test_register_and_login(client):
    # 1. Register new user
    reg_resp = client.post("/api/auth/register", json={
        "email": "analyst_new@decision.ai",
        "username": "analyst_new",
        "full_name": "New Analyst",
        "password": "Password123!",
        "role": "ANALYST"
    })
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["username"] == "analyst_new"
    assert reg_data["role"] == "ANALYST"

    # 2. Login
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "analyst_new",
        "password": "Password123!"
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 3. Access /auth/me
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "analyst_new"


def test_login_invalid_password(client):
    resp = client.post("/api/auth/login", json={
        "username_or_email": "admin",
        "password": "wrongpassword"
    })
    assert resp.status_code == 401


def test_register_duplicate_user(client):
    resp = client.post("/api/auth/register", json={
        "email": "admin@decision.ai",
        "username": "admin",
        "password": "anypassword",
        "role": "ADMIN"
    })
    assert resp.status_code == 400
