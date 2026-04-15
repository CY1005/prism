---
name: new-db-table
description: 新增数据库表的标准流程（Drizzle 真相源 + SQLAlchemy 镜像）
trigger: 需要新增一张表
related_bugs: [BUG-027, BUG-070, BUG-085]
last_updated: 2026-04-15
---

# Skill: 新增数据库表

触发：需要新增一张表

```
1. web/src/db/schema.ts  — Drizzle 定义（单一真相源）
2. DATABASE_URL=... npx drizzle-kit push
3. api/models/tables.py  — SQLAlchemy 镜像，必须 extend_existing=True
4. 如果 FastAPI 写入该表 → 在 tables.py 文件头注释中说明
```

陷阱：
- `text()` 返回 string 不是联合类型 → 组件入口处 `as` 断言（BUG-027）
- JSONB 字段定义用 `jsonb("xxx").$type<YourType>()`，渲染前必须防御检查
- drizzle-kit 不读 .env.local → 必须手动传 DATABASE_URL 前缀（BUG-085）
- 新增列时检查 ORM 列名与 DB 列名是否一致（BUG-070）
