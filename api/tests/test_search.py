def test_unified_search_returns_valid_schema(client):
    resp = client.get("/search/unified", params={"q": "测试"})
    assert resp.status_code == 200
    data = resp.json()
    assert "query" in data
    assert data["query"] == "测试"
    assert "total" in data
    assert "results" in data
    assert isinstance(data["results"], list)


def test_unified_search_empty_query_returns_422(client):
    resp = client.get("/search/unified", params={"q": ""})
    assert resp.status_code == 422


def test_unified_search_with_project_filter(client):
    import uuid
    fake_project = str(uuid.uuid4())
    resp = client.get("/search/unified", params={"q": "功能", "project_id": fake_project})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0  # no data for fake project


def test_node_search_returns_results(client):
    resp = client.get("/search/nodes", params={"q": "模块"})
    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
