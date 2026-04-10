def test_list_projects(client):
    resp = client.get("/api/projects/")
    assert resp.status_code == 200
    data = resp.json()
    assert "projects" in data
    assert "total" in data
    assert isinstance(data["projects"], list)


def test_create_project(client):
    resp = client.post("/api/projects/", json={
        "name": "Test Project",
        "description": "A test project",
        "template_type": "custom",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["name"] == "Test Project"


def test_create_project_empty_name(client):
    resp = client.post("/api/projects/", json={
        "name": "",
    })
    assert resp.status_code == 422
