import uuid

FAKE_PROJECT_ID = str(uuid.uuid4())


def test_project_stats_not_found(client):
    resp = client.get(f"/api/projects/{FAKE_PROJECT_ID}/stats")
    assert resp.status_code == 404


def test_project_tree_not_found(client):
    resp = client.get(f"/api/projects/{FAKE_PROJECT_ID}/tree-overview")
    assert resp.status_code == 404


def test_project_stats_invalid_id(client):
    resp = client.get("/api/projects/not-a-uuid/stats")
    # Should return 404 or 422 (not 500)
    assert resp.status_code in (404, 422)


def test_project_tree_invalid_id(client):
    resp = client.get("/api/projects/not-a-uuid/tree-overview")
    assert resp.status_code in (404, 422)
