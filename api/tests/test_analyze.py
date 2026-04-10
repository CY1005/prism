import uuid


FAKE_PROJECT_ID = str(uuid.uuid4())
FAKE_MODULE_ID = str(uuid.uuid4())


def test_analyze_returns_valid_schema(client):
    resp = client.post("/api/analyze", json={
        "project_id": FAKE_PROJECT_ID,
        "requirement_text": "新增支付退款功能",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "affected_modules" in data
    assert "completeness_issues" in data
    assert "suggestions" in data
    assert data["metadata"]["model"] == "mock"


def test_analyze_empty_text_returns_422(client):
    resp = client.post("/api/analyze", json={
        "project_id": FAKE_PROJECT_ID,
        "requirement_text": "",
    })
    assert resp.status_code == 422


def test_test_points_smoke_returns_3(client):
    resp = client.post("/api/test-points", json={
        "project_id": FAKE_PROJECT_ID,
        "requirement_text": "用户登录功能",
        "affected_modules": [FAKE_MODULE_ID],
        "test_depth": "smoke",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["coverage_summary"]["total"] == 3
    assert len(data["test_points"]) == 3


def test_test_points_standard_returns_8(client):
    resp = client.post("/api/test-points", json={
        "project_id": FAKE_PROJECT_ID,
        "requirement_text": "用户登录功能",
        "affected_modules": [FAKE_MODULE_ID],
        "test_depth": "standard",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["coverage_summary"]["total"] == 8


def test_test_points_comprehensive_returns_15(client):
    resp = client.post("/api/test-points", json={
        "project_id": FAKE_PROJECT_ID,
        "requirement_text": "用户登录功能",
        "affected_modules": [FAKE_MODULE_ID],
        "test_depth": "comprehensive",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["coverage_summary"]["total"] == 15


def test_test_points_coverage_summary_correct(client):
    resp = client.post("/api/test-points", json={
        "project_id": FAKE_PROJECT_ID,
        "requirement_text": "数据导出",
        "affected_modules": [FAKE_MODULE_ID],
        "test_depth": "standard",
    })
    data = resp.json()
    summary = data["coverage_summary"]
    # by_priority values should sum to total
    assert sum(summary["by_priority"].values()) == summary["total"]
    # by_category values should sum to total
    assert sum(summary["by_category"].values()) == summary["total"]
