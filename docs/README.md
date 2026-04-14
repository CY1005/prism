# Prism 文档索引

> Prism — 通用项目知识管理与分析平台
> 最后更新：2026-04-14

---

## 产品定义 (`product/`)

| 文档 | 说明 |
|------|------|
| [PRD.md](product/PRD.md) | 产品需求文档 v1.0（10段式，唯一真相源） |
| [feature-list-and-user-stories.md](product/feature-list-and-user-stories.md) | 功能清单与用户故事 |

---

## 架构文档 (`architecture/`)

| 文档 | 标准 | 说明 |
|------|------|------|
| [arc42-技术架构文档.md](architecture/arc42-技术架构文档.md) | [arc42](https://arc42.org/) 轻量模式 | 系统上下文、构建块视图、运行时视图、横切关注点 |
| [backend-architecture-debate.md](architecture/backend-architecture-debate.md) | — | 后端架构红蓝对抗辩论记录（参考资料，非规范文档） |

**arc42 已覆盖节：** 1(Introduction) / 3(Context) / 5(Building Block) / 6(Runtime) / 8(Crosscutting) / 9(Decisions) / 11(Risks)
**arc42 未覆盖节：** 2(Constraints) / 4(Solution Strategy) / 7(Deployment) / 10(Quality) / 12(Glossary) — 按需补充

---

## 架构决策记录 (`adr/`)

> 格式标准：[MADR 3.0](https://adr.github.io/madr/)

| ADR | 决策 | 状态 |
|-----|------|------|
| [001](adr/001-frontend-framework.md) | Next.js 15 作为前端框架 | Accepted |
| [002](adr/002-database-and-orm.md) | PostgreSQL + Drizzle ORM | Accepted |
| [003](adr/003-server-actions-vs-api-routes.md) | Server Actions 为主 | Accepted |
| [004](adr/004-ai-service-layer.md) | 自定义 LLMProvider | Superseded by 010 |
| [005](adr/005-auth-strategy.md) | Auth.js v5 Credentials | Accepted |
| [006](adr/006-state-management.md) | TanStack Query + Zustand | Accepted |
| [007](adr/007-pgvector-deferred.md) | pgvector 延迟到 v0.3 | Accepted |
| [008](adr/008-project-ownership-evolution.md) | 0.x 个人 / 1.x 团队 | Accepted |
| [009](adr/009-react-flow-state-separation.md) | React Flow 视图/业务分离 | Accepted |
| [010](adr/010-hybrid-architecture-fastapi.md) | 混合架构 Next.js + FastAPI | Accepted |
| [011](adr/011-competitor-entity-and-comparison.md) | 竞品全局实体 + 对比矩阵 | Accepted |
| [012](adr/012-issue-entity-and-visualization.md) | 问题实体 / 关系图 / Treemap | Accepted |
| [013](adr/013-ai-analysis-search-and-version-reorder.md) | AI渐进披露 / Hybrid搜索 / 版本重排 | Accepted |

完整索引见 [adr/README.md](adr/README.md)

---

## 业务设计 (`business-design/`)

| 文档 | 说明 |
|------|------|
| [业务逻辑与流程-v0设计稿.md](business-design/业务逻辑与流程-v0设计稿.md) | v0 原型的业务逻辑提取 |
| [项目创建与知识填充流程设计.md](business-design/项目创建与知识填充流程设计.md) | 项目创建 + 冷启动引导流程 |
| [gemini-import-plan.md](business-design/gemini-import-plan.md) | Gemini 导入方案设计 |

---

## 开发规划 (`dev-plan/`)

| 文档 | 说明 |
|------|------|
| [roadmap.md](dev-plan/roadmap.md) | 版本路线图 |
| [parallel-dev-plan.md](dev-plan/parallel-dev-plan.md) | 前后端并行开发计划 |
| [agent-orchestration.md](dev-plan/agent-orchestration.md) | Agent 编排方案 |
| [vibecoding-workflow.md](dev-plan/vibecoding-workflow.md) | VibeCoding 工作流（IDAKE + Harness + SE 3.0） |

---

## 测试文档 (`testing/`)

| 文档 | 说明 |
|------|------|
| [Prism-测试点-索引.md](testing/Prism-测试点-索引.md) | 测试点索引（入口） |
| [Prism-v0.1-MVP-测试点.md](testing/Prism-v0.1-MVP-测试点.md) | v0.1 测试点 |
| [Prism-v0.2-测试点.md](testing/Prism-v0.2-测试点.md) | v0.2 测试点 |
| [Prism-v0.3-测试点.md](testing/Prism-v0.3-测试点.md) | v0.3 测试点 |
| [Prism-v1.x-测试点.md](testing/Prism-v1.x-测试点.md) | v1.x 测试点 |
| [test-checklist-v0.1-phase1.md](testing/test-checklist-v0.1-phase1.md) | Phase 1 测试清单 |
| [test-checklist-v0.1-phase2.md](testing/test-checklist-v0.1-phase2.md) | Phase 2 测试清单 |
| [test-checklist-v0.1-phase3.md](testing/test-checklist-v0.1-phase3.md) | Phase 3 测试清单 |
| [test-checklist-v0.2-phase4.md](testing/test-checklist-v0.2-phase4.md) | Phase 4 测试清单 |
| [test-checklist-v0.2-phase5.md](testing/test-checklist-v0.2-phase5.md) | Phase 5 测试清单 |
| [test-checklist-v0.2-phase6.md](testing/test-checklist-v0.2-phase6.md) | Phase 6 测试清单 |
| [test-checklist-v0.3-phase7.md](testing/test-checklist-v0.3-phase7.md) | Phase 7 测试清单 |
| [bug-log.md](testing/bug-log.md) | Bug 记录 |
| [pain-log.md](testing/pain-log.md) | Pain 记录（Doom Loop / 绕过记录） |

---

## AI 提示词 (`ai-prompt/`)

VibeCoding ���发过程中使用的 AI 提示词存档。

| 文档 | 用途 |
|------|------|
| [agent-team-prompt-v0.1.md](ai-prompt/agent-team-prompt-v0.1.md) | Agent Team 12-Phase 完整开发提示词 |
| [prompt-generate-all-pages.md](ai-prompt/prompt-generate-all-pages.md) | 补全缺失前端页面提示词 |
| [stitch-prompt.md](ai-prompt/stitch-prompt.md) | Stitch 原型生成 v1 |
| [stitch-prompt-v3.md](ai-prompt/stitch-prompt-v3.md) | Stitch 原型生成 v3 |
| [v0-fix-navigation.md](ai-prompt/v0-fix-navigation.md) | v0 导航修复提示词 |
| [v0-modify-prompt-v3.md](ai-prompt/v0-modify-prompt-v3.md) | v0 修改提示词 v3 |
| [v0-新增页面提示词.md](ai-prompt/v0-新增页面提示词.md) | v0 新增页面提示词 |

---

## 标准参考

| 标准 | 用途 | 链接 |
|------|------|------|
| arc42 | 技术架构文档模板 | https://arc42.org/ |
| MADR 3.0 | 架构决策记录格式 | https://adr.github.io/madr/ |
| christerjohansson/ai-product-requirement-document | PRD 10段式模板 | GitHub |
