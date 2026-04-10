def test_login_invalid_credentials(client):
    resp = client.post("/api/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "wrong",
    })
    assert resp.status_code == 401


def test_login_empty_email(client):
    resp = client.post("/api/auth/login", json={
        "email": "",
        "password": "test",
    })
    assert resp.status_code == 422


def test_get_me(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert "email" in data
    assert "name" in data
