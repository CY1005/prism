"""Mock test point generator.

Generates template-based test points based on requirement text and depth.
Will be replaced with AI generation in a later module.
"""

import uuid


DEPTH_COUNT = {"smoke": 3, "standard": 8, "comprehensive": 15}

TEMPLATES = [
    # (priority, category, title_template)
    ("P0", "functional", "验证{req}的基本功能正常"),
    ("P0", "functional", "验证{req}的核心流程完整"),
    ("P0", "boundary", "验证{req}的边界值处理"),
    ("P1", "functional", "验证{req}与关联模块的交互"),
    ("P1", "exception", "验证{req}的异常输入处理"),
    ("P1", "boundary", "验证{req}的空值/null处理"),
    ("P1", "functional", "验证{req}的数据持久化"),
    ("P1", "exception", "验证{req}的并发场景"),
    ("P2", "performance", "验证{req}的响应时间"),
    ("P2", "functional", "验证{req}的权限控制"),
    ("P2", "exception", "验证{req}的回滚机制"),
    ("P2", "boundary", "验证{req}的大数据量处理"),
    ("P2", "performance", "验证{req}的批量操作性能"),
    ("P2", "functional", "验证{req}的日志记录"),
    ("P2", "exception", "验证{req}的超时处理"),
]


def generate_test_points(
    requirement_text: str,
    affected_modules: list[uuid.UUID],
    test_depth: str = "standard",
) -> dict:
    count = DEPTH_COUNT.get(test_depth, 8)
    # Short summary for template insertion
    req_short = requirement_text[:20] + ("..." if len(requirement_text) > 20 else "")

    points = []
    by_priority: dict[str, int] = {}
    by_category: dict[str, int] = {}

    for i in range(min(count, len(TEMPLATES))):
        priority, category, title_tmpl = TEMPLATES[i]
        module_id = affected_modules[i % len(affected_modules)] if affected_modules else uuid.uuid4()

        point = {
            "id": f"TP-{i+1:03d}",
            "title": title_tmpl.format(req=req_short),
            "description": f"基于需求'{req_short}'生成的{category}类测试点",
            "priority": priority,
            "category": category,
            "related_module": str(module_id),
        }
        points.append(point)
        by_priority[priority] = by_priority.get(priority, 0) + 1
        by_category[category] = by_category.get(category, 0) + 1

    return {
        "test_points": points,
        "coverage_summary": {
            "total": len(points),
            "by_priority": by_priority,
            "by_category": by_category,
        },
    }
