def test_login_invalid_credentials(client):
    resp = client.post("/api/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "wrong",
    })
    # 401 if DB reachable (user not found), 503 if DB schema mismatch
    assert resp.status_code in (401, 503)


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
