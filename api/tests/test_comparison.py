import uuid

FAKE_PROJECT_ID = str(uuid.uuid4())


def test_comparison_returns_valid_schema(client):
    resp = client.get(f"/api/projects/{FAKE_PROJECT_ID}/comparison")
    assert resp.status_code == 200
    data = resp.json()
    assert data["project_id"] == FAKE_PROJECT_ID
    assert "items" in data
    assert "total" in data
    assert data["total"] == 0  # no data for fake project


def test_comparison_with_dimension_key(client):
    resp = client.get(
        f"/api/projects/{FAKE_PROJECT_ID}/comparison",
        params={"dimension_key": "tech_impl"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["dimension_key"] == "tech_impl"
