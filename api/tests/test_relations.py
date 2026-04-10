import uuid

FAKE_PROJECT_ID = str(uuid.uuid4())


def test_relations_returns_valid_schema(client):
    resp = client.get(f"/api/projects/{FAKE_PROJECT_ID}/relations")
    assert resp.status_code == 200
    data = resp.json()
    assert data["project_id"] == FAKE_PROJECT_ID
    assert "nodes" in data
    assert "edges" in data
    assert isinstance(data["nodes"], list)
    assert isinstance(data["edges"], list)
