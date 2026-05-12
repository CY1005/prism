# Bug 模式索引

> 基于 99 个 Bug 的模式统计，5 大分类覆盖 ~80% 的 Bug。
> 每个模式链接到对应的排错 Skill，形成 Bug → Skill 双向导航。

## Top 5 Bug 模式统计

| # | 模式 | Bug 数量 | 占比 | 排错 Skill | 验证项数 |
|---|------|---------|------|-----------|---------|
| 1 | **前后端契约漂移** | 20 | ~28% | [contract-drift](../../skills/debug/contract-drift.md) | 7 |
| 2 | **空状态/边界值未处理** | 14 | ~15% | [empty-state](../../skills/debug/empty-state.md) | 7 |
| 3 | **AI 生成代码过时 API** | 7 | ~10% | [stale-api](../../skills/debug/stale-api.md) | 6 |
| 4 | **认证/权限漏洞** | 4 | ~4% | [auth-permission](../../skills/debug/auth-permission.md) | 6 |
| 5 | **错误处理缺失/静默吞错** | 7 | ~7% | [silent-error](../../skills/debug/silent-error.md) | 7 |

## 模式详情

### 模式 #1：前后端契约漂移（~28%，最高频）

**典型 Bug**：BUG-043~050, BUG-054~062, BUG-066, BUG-070, BUG-082
**症状**：API 返回 500 / 前端 undefined / 字段缺失
**排错 Skill**：[contract-drift.md](../../skills/debug/contract-drift.md)
**预防 Skill**：[frontend-backend-contract.md](../../skills/dev/frontend-backend-contract.md)

### 模式 #2：空状态/边界值未处理（~15%）

**典型 Bug**：BUG-020~026, BUG-033~036, BUG-067, BUG-072, BUG-092
**症状**：页面空白 / Cannot read properties of undefined
**排错 Skill**：[empty-state.md](../../skills/debug/empty-state.md)

### 模式 #3：AI 生成代码过时 API（~10%）

**典型 Bug**：BUG-027~032, BUG-087
**症状**：TypeScript 编译错误 / Property does not exist
**排错 Skill**：[stale-api.md](../../skills/debug/stale-api.md)

### 模式 #4：认证/权限漏洞（~4%）

**典型 Bug**：BUG-075, BUG-076, BUG-080, BUG-095
**症状**：未登录可访问 / 低权限可执行高权限操作
**排错 Skill**：[auth-permission.md](../../skills/debug/auth-permission.md)
**预防 Skill**：[new-ai-endpoint.md](../../skills/dev/new-ai-endpoint.md)（认证检查步骤）

### 模式 #5：错误处理缺失/静默吞错（~7%）

**典型 Bug**：BUG-077, BUG-078, BUG-081, BUG-084, BUG-086, BUG-098, BUG-099
**症状**：操作无反应 / 用户不知道成功还是失败
**排错 Skill**：[silent-error.md](../../skills/debug/silent-error.md)

---

## prism-0420 数据延伸（2026-05-12 新增）

> Prism v1 → prism-0420 shadow 项目（同需求 / 设计前置策略 / AI 实现）的 bug 模式回流。
> 数据源：prism-0420 Sprint 3.1 + 3.2 CI 接通暴露。**独立计数，不并入上方 Top 5 占比**。

### 子模式 #1.b：配置/声明 vs 运行时漂移（契约漂移广义子类）

> 上方模式 #1 是"前后端 API 契约漂移"；本子模式是"声明文本 vs 运行时实际状态"的更早期、更广义版本。AI 写配置/测试代码时"自信抄不验证"的统一表征。

**典型 Bug（prism-0420 数据）**：

| ID | 现象 | 根因 |
|---|---|---|
| P420-001 | CI `pytest --cov` 报 `unrecognized arguments` | `pyproject.toml` dev group 漏 `pytest-cov`；CI 抄了 cicd-plan §8 命令但没去 grep deps 状态 |
| P420-002 | CI `pnpm install --frozen-lockfile` 报 `packages field missing` | `app/pnpm-workspace.yaml` 只声明 `ignoredBuiltDependencies` 无 `packages`；本地 pnpm 10 容忍 / CI pnpm 9 严格 |
| P420-003 | `next build` 报 `Module not found '@/actions/auth'` × 3 处 | Phase 2.2 子片 2 删 auth flow 时未 grep 上游调用方；tsc `--noEmit` 比 next build 宽松没扫到 |
| P420-004 | `pytest tests/test_config.py` CI 挂在 `assert app_env == "local"` | 测试用 `_env_file=None` 但 pydantic-settings 仍读 env vars；CI 设 `APP_ENV=ci` 盖默认 |

**统一根因**：spec 文档 / 配置文本 / 测试代码写完**没在 fresh 环境真跑过**。"AI 抄 spec 但不验证运行时" = "假完成"的早期版本。

**症状**：CI 首次跑红 / Module not found / 命令 unrecognized arguments / 测试断言挂

**预防（Sprint 3.x 立规候选）**：
- **删 module / export 前必跑** `grep -rn "@/<deleted>" src/`——验证 0 调用方再删
- **改 CI yaml / Dockerfile / pyproject 后必用 act 本地跑一次**（不是 push 等 CI 反馈）
- **关闸 audit 必跑 `next build`** 不只是 `tsc --noEmit`——next build 做完整 module resolution 比 tsc 严
- **测试断言"默认值"必先 `monkeypatch.delenv`** 清环境变量——否则 CI env 盖默认会假阳/假阴

**关键洞察**：5 大模式（#1-#5）都在"运行时已部署后"被发现；本子模式在"CI 首次接通"就能拦——更早期、更可工具化（lint 规则 / grep 守护 / act dry-run）。

**STAR 价值**：契约漂移从前后端 API 扩到广义"声明 vs 实际"，对应 AI 质量工程师面试"AI 代码典型问题模式"——可量化（4 bug 1 sprint）+ 可工具化（grep / act / monkeypatch 三件套）。

详见 `_handoff/cross-sprint-punt-pool.md` "2026-05-12 Sprint 3.1+3.2 CI 接通完整收尾" 段（prism-0420 仓库）。

---

## 导航

- **遇到 Bug** → 匹配上方症状 → 读对应排错 Skill 的排查路径
- **开发新功能** → 读对应 Dev Skill 的验证段 → 提前拦截 Bug
- **Skills 总索引** → [docs/skills/INDEX.md](../../skills/INDEX.md)

## 文件说明

- **bug-log.md** — 所有 Bug 的主记录（BUG-001 ~ BUG-099+），包含现象、根因、修复
- **bug-fix-log.md** — 修复过程的详细记录
- **rca-final.md** — 根因分析终版报告，系统性总结
- **pain-log.md** — 开发痛点日志，为工具/流程改进积累素材
