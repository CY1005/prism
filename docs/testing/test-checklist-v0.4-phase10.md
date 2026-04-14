# Test Checklist — Prism v0.4 Phase 10 (F18 Hybrid混合搜索)

**Date**: 2026-04-14
**QA Agent**: Claude Code (Phase 10 QA)
**Scope**: F18 Hybrid混合搜索全部5条AC + 前后端契约对齐 + 安全检查
**Source files**:
- Backend: `api/services/embedding.py`, `api/services/embedding_worker.py`, `api/services/hybrid_search.py`, `api/routers/search.py`(修改), `api/schemas/search.py`(修改), `api/services/search.py`(修改)
- Frontend: `web/src/app/search/page.tsx`(修改), `web/src/services/search.ts`(修改), `web/src/db/schema.ts`(embeddings表)
- Infra: `docker-compose.yml`(pgvector镜像)
- Server Action: `web/src/actions/search.ts`(未修改，透传)

---

## Cross-cutting Checks

| Check | Status | Notes |
|-------|--------|-------|
| hybrid_search 导入 | **PASS** | `api/routers/search.py:10` — `from api.services.hybrid_search import hybrid_search` |
| 路由升级为 async + hybrid | **PASS** | `api/routers/search.py:127-151` — `/unified` 端点改为 `async def`，调用 `hybrid_search()` |
| embedding 模块可导入 | **PASS** | `api/services/embedding.py` — 无外部必须依赖，openai 为可选 |
| docker-compose pgvector 镜像 | **PASS** | `docker-compose.yml:3` — `pgvector/pgvector:pg16` 替代 `postgres:16-alpine` |
| embeddings 表 schema.ts | **PASS** | `web/src/db/schema.ts:293-301` — embeddings 表定义，标注 vector 列由 raw SQL 管理 |
| Server Action 层 | **PASS** | `web/src/actions/search.ts` — `globalSearch()` 调用 `searchUnified()`，透传 userId，无需修改 |
| 前端搜索页调用路径 | **PASS** | `page.tsx:122` — 调用 `globalSearch()` Server Action（非直接 fetch），架构正确 |

---

## F18 AC 验证

### AC1: 搜索框不变，后端同时执行关键词+语义搜索

**Status: ✅ 已实现**

| What | Verified | How |
|------|----------|-----|
| 搜索框未改变 | Yes | `page.tsx:222-229` — 同一个 Input 组件，placeholder 不变 |
| 后端双路执行 | Yes | `hybrid_search.py:309-316` — 先执行 `unified_search()`（关键词），再执行 `vector_search()`（语义） |
| 用户无感知 | Yes | 前端无"模式切换"按钮，唯一入口仍为搜索框 + Enter |
| 路由签名兼容 | Yes | `search.py:127` — 参数签名不变（q, project_id, dimension_type, issue_category, user_id, limit） |

---

### AC2: 双路结果通过 RRF 合并排名

**Status: ✅ 已实现**

| What | Verified | How |
|------|----------|-----|
| RRF 算法实现 | Yes | `hybrid_search.py:29-31` — `rrf_score(rank) = 1/(60+rank)`，k=60 为论文标准值 |
| 双路 score 累加 | Yes | `hybrid_search.py:65-69` — keyword 和 semantic 各自贡献 RRF score，相加 |
| "both" 加权靠前 | Yes | `hybrid_search.py:81` — 同时在两个列表中的结果 match_type="both"，score 为两路之和，排序时自然靠前 |
| 排序降序 + tiebreaker | Yes | `hybrid_search.py:74` — 按 score 降序，keyword rank 做 tiebreaker |
| match_type 标注 | Yes | `hybrid_search.py:81-89` — "both"/"keyword"/"semantic" 三种标注 |

---

### AC3: 搜索"配额"能命中语义相关结果

**Status: ⚠️ 部分实现（代码逻辑支持，但实际效果依赖 Embedding Provider）**

| What | Verified | How |
|------|----------|-----|
| 查询文本 embedding | Yes | `hybrid_search.py:337-338` — 将搜索词 embed 后做余弦相似度检索 |
| OpenAI provider 语义能力 | Yes | `embedding.py:75-105` — text-embedding-3-small 能捕获"配额"与"quota/额度限制/资源上限"的语义关系 |
| Mock provider 语义能力 | **No** | `embedding.py:47-70` — MockEmbeddingProvider 用 SHA256+sin 生成伪向量，无真实语义关系。"配额"和"quota"会产生完全不同的向量 |
| 文本提取覆盖 | Yes | `embedding.py:122-153` — node.name, dimension_record.content, issue.description+tags 都被 embed |
| 向量搜索权限过滤 | Yes | `hybrid_search.py:128-135` — 向量搜索也受 accessible_project_ids 约束 |

**结论**: 代码逻辑完整支持语义搜索。使用 OpenAI provider 时可真正实现语义匹配；使用 Mock provider（开发环境默认）时语义匹配无效，但不影响关键词搜索，符合 AC4 降级预期。

---

### AC4: pgvector 不可用时自动降级到纯关键词搜索

**Status: ✅ 已实现**

| What | Verified | How |
|------|----------|-----|
| pgvector 可用性检测 | Yes | `embedding.py:177-217` — `ensure_embeddings_table()` 在创建 extension 失败时返回 False |
| 全局状态缓存 | Yes | `embedding_worker.py:20-27` — `_PGVECTOR_AVAILABLE` 全局变量，启动时设定一次 |
| hybrid_search 降级路径 | Yes | `hybrid_search.py:327-333` — `is_pgvector_available()` 为 False 时直接返回关键词结果 |
| query embedding 失败降级 | Yes | `hybrid_search.py:335-346` — embed 查询词失败时也降级 |
| vector_search 异常降级 | Yes | `hybrid_search.py:282-284` — vector_search 内部 try/except，任何异常返回空列表 |
| 降级时 match_type 标注 | Yes | `hybrid_search.py:322` — 降级模式下所有结果标注 match_type="keyword" |
| 三层降级保护 | Yes | (1) pgvector 不可用 → 纯关键词; (2) query embed 失败 → 纯关键词; (3) vector_search 返回空 → 纯关键词 |

---

### AC5: F9 全部能力保留

**Status: ⚠️ 部分实现（权限/筛选保留，但 breadcrumb 和 issue_category 有回归）**

| What | Verified | How |
|------|----------|-----|
| 权限控制 | Yes | `hybrid_search.py:306-307` — 调用 `unified_search()` 时传入 user_id，内部做权限过滤 |
| 向量搜索权限一致 | Yes | `hybrid_search.py:348-349` — 调用 `_get_accessible_project_ids()` 获取可访问项目 |
| 路径面包屑（关键词结果） | Yes | `search.py:112,154,202` — keyword 路径保留 breadcrumb 构建 |
| 路径面包屑（语义结果） | **BUG** | `hybrid_search.py:164,219,276` — 所有语义结果 `breadcrumb: None`，见 BUG-063 |
| 问题分类筛选（关键词） | Yes | `search.py:192` — `Issue.category == issue_category` |
| 问题分类筛选（语义） | **BUG** | `hybrid_search.py:240` — 用 `i.type` 但 Issue 表列名是 `category`，SQL 报错，见 BUG-064 |
| 项目筛选 | Yes | keyword 和 vector 两路都支持 project_id 过滤 |
| 维度类型筛选 | Yes | keyword: `DimensionType.name == dimension_type`; vector: `dt.name = %s` |
| 前端筛选面板 | Yes | `page.tsx:250-307` — 项目/维度/问题分类三个筛选面板保留 |
| 前端类型 tab | Yes | `page.tsx:312-328` — 全部/功能项/维度记录/问题 四个 tab 保留 |

---

## 前后端 API 契约对齐检查（重点）

### SearchResultItem 字段对齐

| 字段 | 后端 Pydantic (schemas/search.py) | 后端实际返回 (hybrid_search.py) | 前端 TS 接口 (services/search.ts) | 前端使用 (page.tsx) | 对齐? |
|------|----------------------------------|-------------------------------|----------------------------------|-------------------|-------|
| id | `str` | `str` | `string` | Yes | OK |
| type | `str` | `"node"\|"dimension"\|"issue"` | `"node"\|"dimension"\|"issue"` | Yes | OK |
| title | `str` | `str` | `string` | Yes | OK |
| content_snippet | `str` | `str` | `string` | Yes | OK |
| project_id | `str \| None` | `str` | `string \| null` | Yes | OK |
| project_name | `str \| None` | `str` | `string \| null` | Yes | OK |
| node_id | `str \| None` | `str \| None` | `string \| null` | Yes | OK |
| node_path | `str \| None` | `str \| None` | `string \| null` | Yes | OK |
| breadcrumb | `list[str] \| None` | `list[str] \| None` | `string[] \| null` | Yes | OK |
| dimension_type | `str \| None` | `str \| None` | `string \| null` | Yes | OK |
| issue_category | `str \| None` | `str \| None` | `string \| null` | Yes | OK |
| highlight_positions | `list[dict] \| None` | 未返回（keyword/semantic都没） | 未定义 | 未使用 | OK (双方一致忽略) |
| relevance | `str` default "keyword" | 未返回 | 未定义 | 未使用 | OK (遗留字段) |
| **match_type** | `str` default "keyword" | `"keyword"\|"semantic"\|"both"` | `"keyword"\|"semantic"\|"both"` (optional) | Yes (line 406-419) | **OK** |
| **score** | `float` default 0.0 | `float` (RRF score) | **未定义** | 未使用 | **BUG-065** |
| **search_mode** | **未定义** | `"keyword"\|"hybrid"` | 未定义 | 未使用 | **BUG-066** |

### SearchResponse 字段对齐

| 字段 | 后端 Pydantic (schemas/search.py) | 后端实际返回 (hybrid_search.py) | 前端 TS 接口 (services/search.ts) | 对齐? |
|------|----------------------------------|-------------------------------|----------------------------------|-------|
| query | `str` | `str` | `string` | OK |
| total | `int` | `int` | `number` | OK |
| results | `list[SearchResultItem]` | `list[dict]` | `SearchResultItem[]` | OK |
| **search_mode** | **未定义** | `"keyword"\|"hybrid"` | **未定义** | **BUG-066** |

### 契约检查结论

**整体契约对齐度良好。** 与 Phase 9 的"全面不匹配"不同，F18 的前端正确通过 Server Action 调用后端，字段命名一致性高。

发现 2 个契约问题：
1. **BUG-065**: 前端 `SearchResultItem` 缺少 `score` 字段定义。后端返回了 score，Pydantic schema 有定义（default 0.0），但前端 TS 接口未声明。当前不影响功能（前端未使用 score），但如果未来需要按 relevance 排序展示则需要。
2. **BUG-066**: `search_mode` 字段被 Pydantic `response_model=SearchResponse` 过滤掉，前端永远收不到。前端的 `semanticLoading` 逻辑因此无法正确判断搜索模式。

---

## 安全检查

### 权限控制

| Check | Status | Notes |
|-------|--------|-------|
| Server Action 认证 | **PASS** | `actions/search.ts:21` — `requireAuth()` 校验 JWT |
| userId 传递 | **PASS** | `actions/search.ts:24` — `userId: user.id` 透传到后端 |
| 后端权限过滤 | **PASS** | `search.py:88-91` — `_get_accessible_project_ids()` 限制非 admin 用户只能搜索所属项目 |
| 向量搜索权限过滤 | **PASS** | `hybrid_search.py:128-135,169-176,230-233` — 三类实体的向量搜索都过滤 accessible_project_ids |
| platform_admin 无限制 | **PASS** | `search.py:27` — `role == "platform_admin"` 返回 None，不做项目过滤 |

### 向量注入风险

| Check | Status | Notes |
|-------|--------|-------|
| 查询文本 embedding 注入 | **LOW** | embedding provider 将查询文本转为数值向量，SQL 中以 `%s::vector` 参数化传入，不存在 SQL 注入路径 |
| 向量字符串构造 | **PASS** | `hybrid_search.py:116` — `vec_str` 用 `f"{v:.8f}"` 格式化浮点数，无用户输入拼接 |
| SQL 参数化 | **PASS** | `hybrid_search.py:150-152,199-201,260-262` — 全部使用 `exec_driver_sql` + `%s` 参数化 |
| embedding.py upsert | **PASS** | `embedding.py:232-243` — 使用 `exec_driver_sql` 参数化，向量值用格式化浮点数构造 |

### 其他安全

| Check | Status | Notes |
|-------|--------|-------|
| OpenAI API Key 泄露 | **PASS** | `embedding.py:112` — 从环境变量读取，不在代码中硬编码 |
| Embedding 内容泄露 | **LOW** | 如果用 OpenAI provider，文本内容会发送到 OpenAI API。对于企业敏感数据场景需评估合规性，但这是 PRD 既定方案 |

---

## 前端特有检查

| Check | Status | Notes |
|-------|--------|-------|
| match_type badge 展示 | **PASS** | `page.tsx:406-419` — semantic 显示"语义匹配"，both 显示"精确+语义" |
| semanticLoading 状态 | **BUG** | `page.tsx:119,139-146` — 设为 true 后，仅在结果中包含 semantic/both 时才设为 false。纯关键词模式下永远 spinning，见 BUG-067 |
| keyword highlight 兼容 | **PASS** | `page.tsx:69-84` — 语义匹配结果的标题和内容也会尝试高亮（即使可能无精确匹配），不会报错 |
| 结果链接 | **PASS** | `page.tsx:388-394` — 保留 F9 的 project/feature 链接逻辑 |

---

## BUG 汇总

| ID | 严重度 | 描述 | 根因 | 受影响文件 |
|----|--------|------|------|-----------|
| BUG-063 | **High** | 语义搜索结果缺失 breadcrumb，F9 面包屑能力回归 | vector_search 中三类实体结果均硬编码 `breadcrumb: None` | `api/services/hybrid_search.py:164,219,276` |
| BUG-064 | **Critical** | Issue 向量搜索 SQL 引用不存在的列 `i.type`，实际列名为 `category` | 代码引用了错误的列名 | `api/services/hybrid_search.py:240,247` |
| BUG-065 | **Low** | 前端 SearchResultItem 接口缺少 `score` 字段定义 | 前端 TS 类型未同步后端新增字段 | `web/src/services/search.ts:9-22` |
| BUG-066 | **Medium** | `search_mode` 字段被 Pydantic response_model 过滤，前端永远收不到 | `SearchResponse` schema 未定义 `search_mode` 字段 | `api/schemas/search.py:22-25`, `api/services/hybrid_search.py:332,345,366,376` |
| BUG-067 | **High** | 纯关键词降级模式下"正在加载语义匹配结果..."永远转圈 | `semanticLoading` 仅在结果包含 semantic/both 时才设 false，降级模式下条件永不满足 | `web/src/app/search/page.tsx:119,139-146` |

---

## 总结

### 完成状态

| AC | 描述 | 状态 | 备注 |
|----|------|------|------|
| AC1 | 搜索框不变，后端双路搜索 | ✅ 已实现 | 架构正确，前端通过 Server Action 调用 |
| AC2 | RRF 合并排名 | ✅ 已实现 | k=60 标准实现，match_type 标注正确 |
| AC3 | 语义搜索命中相关结果 | ⚠️ 部分实现 | 代码逻辑完整，但 Mock provider 无真实语义能力；Issue 向量搜索因列名错误会 SQL 报错(BUG-064) |
| AC4 | pgvector 不可用时降级 | ✅ 已实现 | 三层降级保护，但前端 loading 指示器有 bug(BUG-067) |
| AC5 | F9 全部能力保留 | ⚠️ 部分实现 | 权限/筛选保留; 语义结果缺 breadcrumb(BUG-063); Issue 向量搜索列名错(BUG-064) |

### 根因分析

**本次发现的问题比 Phase 9 少且轻得多。** 架构层面正确（前端通过 Server Action 调用，未绕过），契约基本对齐。

核心问题在于：
1. **Issue 表列名不一致**：Issue 模型用 `category`，但 hybrid_search.py 的 raw SQL 写了 `i.type`。F9 的 keyword 搜索用 ORM（`Issue.category`）所以正确，F18 的 vector 搜索用 raw SQL 引入了这个错误。这是 ORM 与 raw SQL 混用的典型风险。
2. **向量搜索结果缺失 breadcrumb**：keyword 搜索通过 ORM Join + `_build_breadcrumb()` 构建面包屑，但 vector_search 的 raw SQL 没有做等价的 breadcrumb 构建逻辑。
3. **前端 loading 状态依赖后端未传递的信号**：`search_mode` 被 Pydantic 过滤，`semanticLoading` 无法正确判断是降级还是加载中。

### 修复优先级

1. **P0**: BUG-064 — `hybrid_search.py` 中 `i.type` 改为 `i.category`（Issue 向量搜索完全不可用）
2. **P1**: BUG-067 — `semanticLoading` 逻辑修复（纯关键词模式下 loading spinner 永远转圈，影响用户体验）
3. **P1**: BUG-063 — 向量搜索结果补充 breadcrumb 构建（F9 能力回归）
4. **P2**: BUG-066 — `SearchResponse` schema 添加 `search_mode` 字段，前端可据此判断搜索模式
5. **P3**: BUG-065 — 前端 TS 接口补充 `score` 字段（当前不影响功能）
