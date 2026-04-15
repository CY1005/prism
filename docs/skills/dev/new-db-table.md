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

## 验证

- [ ] `web/src/db/schema.ts` 中新表定义完整（字段、类型、默认值、约束）
- [ ] `DATABASE_URL=... npx drizzle-kit push` 成功，无报错
- [ ] `api/models/tables.py` 中 SQLAlchemy 镜像已添加，标记 `extend_existing=True`
- [ ] ORM 列名与 DB 实际列名一致（检查 drizzle-kit 输出）
- [ ] JSONB 字段定义使用 `jsonb("xxx").$type<YourType>()`
- [ ] `text()` 类型列在组件入口处做了类型断言（非联合类型）
- [ ] `tsc --noEmit` 零错误

## 执行检查点

1. **Drizzle Schema 定义完成后**：`tsc --noEmit` 确认类型正确
2. **drizzle-kit push 完成后**：连接数据库确认表结构 `\d table_name`
3. **SQLAlchemy 镜像完成后**：`python -c "from api.models.tables import *; print('OK')"` 确认可导入
4. **如果 FastAPI 写入该表**：确认 `tables.py` 文件头注释已说明

## 改进触发器

- 发现新的 Schema 同步陷阱（Drizzle ↔ SQLAlchemy 不一致）→ 追加到"陷阱"段
- drizzle-kit 版本升级导致行为变更 → 更新步骤和注意事项
- 验证项发现遗漏 → 追加到"验证"段
- 本 Skill 连续 3 次使用无新发现 → 标记为"稳定"
- 上次更新超过 30 天且有新 Bug 属于本模式 → 强制 Review
