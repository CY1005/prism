import uuid

FAKE_PROJECT_ID = str(uuid.uuid4())


def test_get_settings_not_found(client):
    resp = client.get(f"/api/projects/{FAKE_PROJECT_ID}/settings")
    assert resp.status_code == 404


def test_patch_settings_not_found(client):
    resp = client.patch(
        f"/api/projects/{FAKE_PROJECT_ID}/settings",
        json={"name": "New Name"},
    )
    assert resp.status_code == 404
