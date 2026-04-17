def test_login_success(client, super_admin):
    resp = client.post("/auth/login", json={"email": "admin@test.com", "password": "password123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_login_wrong_password(client, super_admin):
    resp = client.post("/auth/login", json={"email": "admin@test.com", "password": "wrong"})
    assert resp.status_code == 401

def test_me_authenticated(client, super_admin):
    token = client.post("/auth/login", json={"email": "admin@test.com", "password": "password123"}).json()["access_token"]
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@test.com"

def test_me_no_token(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401
