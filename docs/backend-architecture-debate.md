# Prism 后端架构设计 -- 红蓝对抗辩论记录与定稿

> 方法：双Agent对抗式设计（蓝方提案 → 红方质疑 → 蓝方回应 → 定稿）
> 输入：163条业务逻辑（v0设计稿）+ 10个ADR + PRD v1.0 + arc42技术架构
> 日期：2026-04-10
> 状态：定稿

---

## 目录

1. [辩论过程总览](#辩论过程总览)
2. [蓝方原始方案](#蓝方原始方案)
3. [红方质疑清单](#红方质疑清单)
4. [逐条辩论记录](#逐条辩论记录)
5. [定稿方案](#定稿方案)
6. [开工前必做清单](#开工前必做清单)

---

## 辩论过程总览

| 维度 | 蓝方提出 | 红方质疑 | 最终结论 |
|------|---------|---------|---------|
| 架构设计 | 10个action + 10个service + 10张表 + 4个FastAPI端点 | 假分层、事务遗漏、is_current陷阱、path无索引策略 | 保留分层但聚合service、修复is_current、补事务清单 |
| 用户使用 | 6步冷启动、全toast错误、SSE流式AI分析 | 冷启动太长、错误不分轻重、AI链路脆弱 | 压缩到3步、三级错误、AI异步化 |
| 安全性 | JWT 7天、HS256、内存速率限制、AES加密 | 无吊销机制、密钥管理、容器间无认证 | JWT 24h+吊销字段、登录用DB限速、FastAPI双层验证 |
| 扩展性 | 4版本演进、6项"现在做对"、7项技术债 | 无备份、范围过大、Drizzle未验证 | 加备份、不砍范围但做spike、补审计日志基础 |

**统计**：20条质疑，8条完全接受，11条部分接受，1条反驳。

---

## 蓝方原始方案

### 维度1：后端架构（服务层设计）

#### 1.1 Next.js Server Actions 层模块划分

```
src/
├── actions/           # 入口层：收参 → zod校验 → 鉴权 → 调service → revalidate
│   ├── auth.ts        # 登录/注册/登出 (覆盖 1.1-1.10)
│   ├── project.ts     # 项目CRUD/模板/配置 (覆盖 2.x, 3.x, 4.x)
│   ├── node.ts        # 节点树CRUD/拖拽排序/删除 (覆盖 7.1.x)
│   ├── dimension.ts   # 维度记录CRUD (覆盖 7.2.x, 7.3.x)
│   ├── version.ts     # 版本演进CRUD (覆盖 7.4.x)
│   ├── member.ts      # 成员邀请/角色/移除 (覆盖 11.4.x)
│   ├── settings.ts    # 项目设置5子模块 (覆盖 11.1-11.5)
│   ├── search.ts      # 关键词搜索 (覆盖 10.x)
│   ├── admin.ts       # 运维后台 (覆盖 12.x)
│   └── analysis.ts    # 调用FastAPI的桥接action (覆盖 8.x, 9.x)
│
├── services/          # 业务逻辑层：纯函数，不依赖Request/Response
│   ├── auth.service.ts
│   ├── project.service.ts
│   ├── node.service.ts
│   ├── dimension.service.ts
│   ├── version.service.ts
│   ├── member.service.ts
│   ├── search.service.ts
│   ├── admin.service.ts
│   ├── permission.service.ts    # 统一权限判断
│   └── analyzer-client.ts       # FastAPI HTTP客户端封装
│
├── db/
│   ├── schema/        # Drizzle schema定义（单一真相源）
│   ├── queries/       # 复杂查询封装（WITH RECURSIVE等）
│   ├── migrations/    # Drizzle migration文件
│   └── index.ts       # drizzle实例导出
│
└── lib/
    ├── auth.ts        # Auth.js v5 配置
    ├── validators/    # zod schema（前后端共享）
    └── errors.ts      # 统一错误类型
```

**设计理由**：
- actions/ 按业务域分文件，一个action函数 = 一个用户操作
- services/ 是可测试的纯业务逻辑
- db/queries/ 封装复杂SQL

#### 1.2 FastAPI 端点设计（仅4个端点走FastAPI）

```
FastAPI (port 8001, 仅Docker内网可达)
├── POST /api/v1/analyze          # 需求分析 (覆盖 8.8-8.13)
├── POST /api/v1/test-points      # 测试点生成 (覆盖 8.15)
├── POST /api/v1/compare          # 竞品对比 (覆盖 9.4-9.6)
└── GET  /api/v1/search/semantic  # 语义搜索 (v0.3)
```

#### 1.3 原始Schema设计（10张表）

| 表 | 职责 | 关键设计 |
|----|------|---------|
| users | 用户认证 | email UNIQUE, bcrypt hash |
| projects | 项目根实体 | hierarchy_labels JSONB, ai_api_key_enc AES加密 |
| project_members | 项目成员 | (project_id, user_id) UNIQUE, role |
| dimension_types | 维度注册表 | 12条预置, field_schema JSONB |
| project_dimension_config | 项目×维度配置 | enabled, sort_order |
| nodes | 自引用树 | materialized path, depth |
| dimension_records | 维度数据 | content JSONB, version 乐观锁 |
| node_relations | 节点关联 | source + target + type |
| version_records | 版本记录 | is_current BOOLEAN |
| knowledge_items | 知识条目 | FastAPI读写 |

#### 1.4 原始事务边界（7个场景）

新建项目、删除项目、创建节点、拖拽排序、维度管理保存、版本is_current切换、CSV导入

---

### 维度2：用户使用流程设计

#### 2.1 原始冷启动（6步）

注册 → 空状态 → 创建项目 → 手动创建模块 → 创建功能项 → 首次录入

#### 2.2 AI分析流程（SSE流式）

文件上传Server Action → API Route(SSE) → FastAPI → Claude API → SSE回传 → Server Action保存

#### 2.3 错误恢复

全toast非阻塞，session过期保留redirect URL

---

### 维度3：安全性设计

- 认证：Auth.js v5 Credentials, JWT 7天maxAge, HS256
- 授权：4角色权限矩阵，service层手动checkProjectAccess
- API Key：AES-256-GCM加密存储
- 容器间：FastAPI不暴露端口 + X-Internal-Token
- 速率限制：内存Map计数

---

### 维度4：演进路径

- v0.1: Next.js单体
- v0.2: +FastAPI
- v0.3: +pgvector
- v1.0: +teams

---

## 红方质疑清单

### 🔴 必须修复（5条）

| # | 质疑 | 核心问题 |
|---|------|---------|
| Q1 | version_records.is_current BOOLEAN | 无法用约束保证唯一性，并发产生脏数据 |
| Q2 | JWT 7天+无吊销机制 | 改密码/禁用后旧token仍有效7天 |
| Q3 | AI分析链路无恢复策略 | SSE 6步链路，任何环节断了结果丢失 |
| Q4 | 无数据备份策略 | Docker volume = 零保护 |
| Q5 | v0.1范围过大+Drizzle未验证 | 4-6周工作量 + 核心ORM假设未验证 |

### 🟡 建议修复（14条）

| # | 质疑 | 核心问题 |
|---|------|---------|
| Q6 | actions/services 1:1假分层 | 1人开发维护负担 |
| Q7 | 事务边界遗漏 | 批量维度更新、成员变更、AI结果保存 |
| Q8 | materialized path无索引策略 | TEXT+LIKE vs ltree+GiST未决定 |
| Q9 | JSONB校验只在应用层 | FastAPI绕过ajv直接写DB |
| Q10 | TS/Python类型手动同步 | 定时炸弹 |
| Q11 | HS256密钥管理 | 密钥长度、日志泄露、轮换 |
| Q12 | 速率限制内存Map | 容器重启归零 |
| Q13 | X-Internal-Token不是认证 | FastAPI不验证用户身份 |
| Q14 | API Key加密密钥管理 | nonce、轮换方案未明确 |
| Q15 | 冷启动6步太多 | 第3-4步用户卡住 |
| Q16 | 错误处理不分轻重 | 全toast用户以为成功 |
| Q17 | 乐观锁冲突UX未设计 | 用户编辑内容丢失 |
| Q19 | 审计日志应"现在做对" | 后期改造成本高 |
| Q20 | dimension_types注册表过度设计 | v0.1不需要运行时注册表 |

### 🟢 可接受（1条）

| # | 质疑 | 核心问题 |
|---|------|---------|
| Q18 | 未提到CSRF防护 | 当前架构风险低但未文档化 |

---

## 逐条辩论记录

### Q1: version_records.is_current BOOLEAN

> **为什么红方质疑**：`is_current BOOLEAN` 切换需要"先设false再设true"两步操作，无法用PG约束保证每个node只有一个is_current=true。并发场景下可能产生0个或2个true。

> **为什么蓝方接受**：红方说得对。is_current是冗余数据，真相源应该只有一个。nodes表加current_version_id FK是更干净的设计——切换版本只需UPDATE一行。

> **为什么定为此版**：数据完整性由数据库约束而非应用逻辑保证，是数据库设计的基本原则。FK天然保证了"只有一个当前版本"的不变式。

**结论：✅ 接受** — nodes表加`current_version_id UUID FK`，删除version_records.is_current

---

### Q2: JWT 7天无吊销机制

> **为什么红方质疑**：用户改密码或被管理员禁用后，旧JWT仍然有效7天。对存储企业知识资产的平台不可接受。

> **为什么蓝方部分接受**：安全担忧合理，但refresh token对1人开发太重。Auth.js的JWT模式下引入refresh token需要大量前端改造（静默刷新、401重试队列）。

> **为什么定为此版**：方案B的简化版（users表加token_invalidated_at字段）只需Auth.js jwt callback加3行逻辑，工程量极低但解决了核心安全问题。JWT从7天改为24小时，平衡了安全性和用户体验。不引入refresh token是因为24h+服务端吊销已足够。

**结论：⚠️ 部分接受** — JWT 24h + users.token_invalidated_at，不引入refresh token

---

### Q3: AI分析链路断线无恢复

> **为什么红方质疑**：SSE 6步链路（前端→Next.js→FastAPI→Claude API→FastAPI→Next.js→前端）任何一步断了用户都丢失结果。AI分析可能耗时30-120s，用户关tab就前功尽弃。

> **为什么蓝方接受**：核心功能的可靠性不能依赖一个长连接。异步化（task_id + 结果持久化）是标准做法，且比SSE更容易实现。

> **为什么定为此版**：异步模式的优势：1) 用户关tab不影响后端分析 2) 结果持久化可重复查看 3) 相同输入可缓存 4) 前端实现更简单（轮询比SSE错误处理简单）。新增analysis_tasks表存储任务状态和结果。

**结论：✅ 接受** — 异步task_id模式 + 结果持久化 + 缓存

---

### Q4: 无数据备份

> **为什么红方质疑**：存储企业知识资产的系统，数据在Docker volume里无任何备份。磁盘故障=全部丢失。

> **为什么蓝方接受**：这不是设计争议，是运维基本功。半小时工作量。

> **为什么定为此版**：cron + pg_dump是最简单有效的方案。保留7天足够回溯。不需要引入额外依赖。

**结论：✅ 接受** — scripts/backup.sh + cron每天pg_dump

---

### Q5: v0.1范围过大 + Drizzle未验证

> **为什么红方质疑**：v0.1包含10张表+认证+权限+JSONB校验+乐观锁+事务+版本管理，对1个开发者至少4-6周。Drizzle对JSONB/事务/materialized path的支持未验证。

> **为什么蓝方部分接受**：范围估算偏悲观（没考虑VibeCoding效率），但Drizzle技术验证确实没做。IDAKE方法论的前提是"核心假设已验证"，ORM的能力是核心假设。

> **为什么定为此版**：不砍范围是因为roadmap已按周拆分（v0.0.1→v0.0.4），每周交付一个可用版本。但Week 1 Day 1必须做Drizzle spike——如果发现关键能力不支持，要么换ORM要么用raw SQL，不能到v0.0.3才发现。

**结论：⚠️ 部分接受** — 不砍范围，Week 1 Day 1做Drizzle spike（JSONB/事务/path查询/乐观锁）

---

### Q6: actions/services 1:1假分层

> **为什么红方质疑**：10个actions对应10个services，每加一个功能改两个文件但没有真正的抽象边界。1人开发的v0.1是纯维护负担。

> **为什么蓝方部分接受**：1:1映射确实是低效的，但ADR-003明确了分层约束的原因（防止action堆业务逻辑），完全不分层会在v0.2代码腐化。

> **为什么定为此版**：保留分层约束（这是经过GPT Review验证的架构决策），但service按领域聚合。不是10个service文件，而是按领域聚合为5-6个。action保持细粒度（每个用户操作一个函数），但调用聚合后的service。

**结论：⚠️ 部分接受** — 保留分层，service按领域聚合（不1:1）

---

### Q7: 事务边界遗漏

> **为什么红方质疑**：遗漏了批量维度更新、成员角色变更、AI结果保存三个事务场景。

> **为什么蓝方接受**：确实遗漏。原则应该是"涉及多行写入默认用事务"。

> **为什么定为此版**：补充完整事务清单共10个场景。宁可多事务（性能微损）也不要少事务（数据不一致）。

**结论：✅ 接受** — 补充至10个事务场景

完整事务清单：
| 操作 | 事务范围 |
|------|---------|
| 新建项目 | INSERT project + dimension_config(N) + project_member |
| 删除项目 | 权限检查 + CASCADE删除 |
| 创建节点 | INSERT node + 计算path |
| 移动节点 | 更新path + 所有子节点path前缀 |
| 拖拽排序 | 批量UPDATE sort_order |
| 维度管理保存 | 批量UPDATE dimension_config |
| 版本切换 | UPDATE nodes.current_version_id |
| 批量维度更新 | 多个dimension_record的upsert |
| 成员角色变更 | UPDATE member.role + 审计日志 |
| AI结果保存 | UPDATE analysis_task.status + 写result + 可能创建knowledge_items |

---

### Q8: materialized path索引策略

> **为什么红方质疑**：推荐ltree + GiST索引，TEXT + LIKE性能随数据量线性下降。

> **为什么蓝方部分接受**：ltree技术上最优，但Prism树深度固定3层、节点数上限几百。引入PG extension增加部署依赖。

> **为什么定为此版**：对3层×几百节点的规模，TEXT + btree + LIKE前缀匹配完全足够。btree支持前缀匹配走索引。如果节点超过1000再考虑ltree。在Drizzle spike中验证性能。

**结论：⚠️ 部分接受** — v0.1 TEXT + btree索引，spike验证性能

---

### Q9: JSONB校验只在应用层

> **为什么红方质疑**：FastAPI直接写knowledge_items绕过Next.js的ajv校验。

> **为什么蓝方部分接受**：FastAPI侧有Pydantic校验（Python侧的schema验证），不是完全无校验。PG层CHECK约束写JSONB校验维护成本高。

> **为什么定为此版**：两端各自用自己生态的校验库（Zod/Pydantic）。PG层只加最基础的`CHECK (content IS NOT NULL AND content != '{}'::jsonb)`兜底。真正的风险是"两端schema定义不一致"，归入Q10统一解决。

**结论：⚠️ 部分接受** — PG只加非空CHECK，两端各自校验

---

### Q10: TypeScript类型手动同步

> **为什么红方质疑**：Next.js和FastAPI之间的类型定义需要手动同步，必然出错。

> **为什么蓝方接受**：手动同步是架构设计的已知代价，需要用工程手段缓解。

> **为什么定为此版**：SQLAlchemy改用`autoload_with=engine`自动反射PG表结构，不手写model。这样Drizzle migration改表后FastAPI重启即自动同步。Pydantic model仍手写（API契约），但这只有4个端点的输入输出，维护量极低。

**结论：✅ 接受** — SQLAlchemy用autoload反射，Drizzle为唯一真相源

---

### Q11: HS256密钥管理

> **为什么红方质疑**：密钥长度、日志泄露、轮换方案未明确。

> **为什么蓝方部分接受**：密钥长度和注入方式需要规范，但轮换机制对1-20人内部工具不值得做。

> **为什么定为此版**：`openssl rand -base64 33`生成密钥（>256 bits）。通过docker-compose env_file注入。不做轮换——密钥泄露时改AUTH_SECRET+重启+配合Q2的token_invalidated_at即可使所有旧token失效。

**结论：⚠️ 部分接受** — 密钥>=256位+env_file注入，不做轮换

---

### Q12: 速率限制内存Map

> **为什么红方质疑**：容器重启后计数器归零。登录端点的暴力破解保护失效。

> **为什么蓝方部分接受**：对1-20人内部工具暴力破解威胁接近零，但登录端点的保护成本很低值得做。

> **为什么定为此版**：登录端点用DB级保护（users表加failed_login_count + locked_until），连续5次失败锁定15分钟。其他端点保持内存Map（重启归零可接受）。不引入Redis。

**结论：⚠️ 部分接受** — 登录用DB记录，其他保持内存Map

---

### Q13: X-Internal-Token不是认证

> **为什么红方质疑**：FastAPI只验证共享密码，不验证用户身份。Next.js被攻破后攻击者可以以任意身份调用FastAPI。

> **为什么蓝方接受**：纵深防御原则。即使Docker内网攻击面小，也不应该在某一层完全放弃验证。

> **为什么定为此版**：双层验证——X-Internal-Token确认请求来自可信服务（第一层），JWT传递并验证用户身份（第二层）。FastAPI用JWT里的user_id查project_members确认权限。成本很低（FastAPI解析JWT只需共享AUTH_SECRET）。

**结论：✅ 接受** — FastAPI双层验证：X-Internal-Token + 用户JWT

---

### Q14: API Key加密密钥管理

> **为什么红方质疑**：nonce生成策略和密钥轮换方案未明确。AES-256-GCM用错比不加密更危险。

> **为什么蓝方部分接受**：nonce策略确实需要明确。但密钥轮换对内部工具过度设计。

> **为什么定为此版**：每次加密随机生成12字节IV，与密文一起存储（格式：`{iv}:{ciphertext}:{authTag}`）。密钥泄露时手动改密钥+脚本重新加密所有API Key（用户量极小，一次性跑完）。封装为lib/crypto.ts。

**结论：⚠️ 部分接受** — 随机IV+明确存储格式，不做自动轮换

---

### Q15: 冷启动步骤过多

> **为什么红方质疑**：6步冷启动，第3-4步用户面对空白画布不知道做什么。

> **为什么蓝方部分接受**：PRD F11已有引导设计，关键是实现到位。

> **为什么定为此版**：模板创建后自动创建示例数据（示例产品线→示例模块→示例功能项+示例维度数据），标记is_example。用户看到示例理解结构后，修改或删除示例开始自己的内容。冷启动从6步压缩到3步。

**结论：⚠️ 部分接受** — 模板自动创建示例数据，3步冷启动

---

### Q16: 错误处理不分轻重

> **为什么红方质疑**：权限不足、数据冲突用toast一闪而过，用户以为操作成功。

> **为什么蓝方接受**：全toast确实是懒惰设计。不同错误需要不同级别的用户注意力。

> **为什么定为此版**：三级错误处理策略，在lib/errors.ts统一定义和处理。

**结论：✅ 接受** — 三级错误处理

| 级别 | 场景 | UI | 用户行为 |
|------|------|-----|---------|
| 阻塞级 | 权限/冲突/未登录 | 模态框 | 必须处理 |
| 警告级 | AI超时/网络/保存失败 | 顶部banner+重试 | 重试或稍后 |
| 通知级 | 保存成功/导入完成 | toast 3秒 | 无需操作 |

---

### Q17: 乐观锁冲突UX

> **为什么红方质疑**：冲突时只报错，用户编辑内容丢失。

> **为什么蓝方接受**：20人协作场景下冲突会真实发生，丢失用户编辑是不可接受的。

> **为什么定为此版**：v0.1简化方案（提示冲突+自动复制编辑内容到剪贴板+刷新到最新版本），v0.2做完整的diff视图。"至少不丢数据"是底线。

**结论：✅ 接受** — v0.1提示+剪贴板，v0.2 diff视图

---

### Q18: CSRF防护

> **为什么红方质疑**：未明确说明CSRF威胁模型。

> **为什么蓝方接受**：当前架构风险确实低，但需要文档说明"为什么不需要额外防护"。

> **为什么定为此版**：Auth.js内置CSRF token + Server Actions用POST + SameSite cookie + FastAPI不暴露给浏览器 = 无需额外实现。在ADR-005补充说明。

**结论：✅ 接受（文档补充）**

---

### Q19: 审计日志基础设施

> **为什么红方质疑**：审计日志放"预留"，后期所有service都要改一遍。

> **为什么蓝方部分接受**：全量审计日志表对v0.1过度设计，但structured logging基础设施应该从头做对。

> **为什么定为此版**：v0.1用pino做structured logging到stdout（JSON格式）。Docker日志驱动收集。v0.2 F15需要审计UI时再入库。成本极低（lib/logger.ts + 每个action加一行日志）。

**结论：⚠️ 部分接受** — pino structured logging到stdout，不建audit表

---

### Q20: dimension_types注册表过度设计

> **为什么红方质疑**：v0.1不需要运行时可配的维度注册表，硬编码5-8个固定维度更简单。

> **为什么蓝方反驳**：PRD核心设计哲学是"加新维度=数据操作不改表"。不同模板预设不同维度组合（产品分析8个、系统架构6个），这在v0.1就需要。dimension_types只是一张种子数据表，工程量极低。

> **为什么定为此版**：保留dimension_types表（12条种子数据），但v0.1只读——不提供运行时增删维度的API。新维度通过migration+seed脚本实现。这是唯一一条蓝方反驳红方的质疑，因为维度可配是Prism的核心卖点之一。

**结论：❌ 反驳** — 保留注册表，v0.1只读

---

## 定稿方案

### Schema定稿（11张表）

```sql
-- 1. users（修改：+token_invalidated_at, +failed_login_count, +locked_until）
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  password_hash         TEXT NOT NULL,
  role                  TEXT NOT NULL DEFAULT 'user',  -- 'platform_admin' | 'user'
  status                TEXT NOT NULL DEFAULT 'active', -- 'active' | 'disabled'
  token_invalidated_at  TIMESTAMPTZ,                    -- 🆕 改密码/禁用时设为NOW()
  failed_login_count    INT NOT NULL DEFAULT 0,         -- 🆕 连续失败次数
  locked_until          TIMESTAMPTZ,                    -- 🆕 锁定截止时间
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- 2. projects
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  template_type   TEXT NOT NULL,
  hierarchy_labels JSONB NOT NULL DEFAULT '["产品线","模块","功能项"]',
  version_mode    TEXT NOT NULL DEFAULT 'release',
  ai_provider     TEXT DEFAULT 'local',
  ai_api_key_enc  TEXT,  -- AES-256-GCM: {iv}:{ciphertext}:{authTag}
  created_by      UUID REFERENCES users(id) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. project_members
CREATE TABLE project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role       TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 4. dimension_types（全局注册表，12条种子数据，v0.1只读）
CREATE TABLE dimension_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL,
  description TEXT,
  field_schema JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. project_dimension_config
CREATE TABLE project_dimension_config (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  dimension_type_id UUID REFERENCES dimension_types(id) NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  UNIQUE(project_id, dimension_type_id)
);

-- 6. nodes（修改：+current_version_id FK）
CREATE TABLE nodes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  parent_id           UUID REFERENCES nodes(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL,
  path                TEXT NOT NULL,  -- materialized path, btree索引
  depth               INTEGER NOT NULL DEFAULT 0,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  current_version_id  UUID,            -- 🆕 FK到version_records（延迟约束）
  status              TEXT DEFAULT 'active',
  version_introduced  TEXT,
  created_by          UUID REFERENCES users(id),
  updated_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_nodes_path ON nodes USING btree(path);
CREATE INDEX idx_nodes_project ON nodes(project_id);
-- current_version_id FK在表创建后ALTER TABLE添加（循环引用）

-- 7. dimension_records
CREATE TABLE dimension_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id           UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  dimension_type_id UUID REFERENCES dimension_types(id) NOT NULL,
  content           JSONB NOT NULL CHECK (content IS NOT NULL AND content != '{}'::jsonb),  -- 🆕 基础CHECK
  version           INTEGER NOT NULL DEFAULT 1,
  created_by        UUID REFERENCES users(id),
  updated_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_dim_records_node ON dimension_records(node_id);

-- 8. node_relations
CREATE TABLE node_relations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_node_id  UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id  UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  relation_type   TEXT NOT NULL,
  description     TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_node_id, target_node_id, relation_type)
);

-- 9. version_records（修改：删除is_current字段）
CREATE TABLE version_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id       UUID REFERENCES nodes(id) ON DELETE CASCADE NOT NULL,
  version_label TEXT NOT NULL,
  change_type   TEXT NOT NULL DEFAULT 'added',
  summary       TEXT,
  detail        JSONB,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(node_id, version_label)
);
-- 添加延迟FK：
ALTER TABLE nodes ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id) REFERENCES version_records(id)
  ON DELETE SET NULL;

-- 10. knowledge_items
CREATE TABLE knowledge_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  node_id      UUID REFERENCES nodes(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  tags         JSONB DEFAULT '[]',
  source       TEXT DEFAULT 'manual',
  confidence   FLOAT DEFAULT 1.0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 11. analysis_tasks（🆕 AI分析异步化）
CREATE TABLE analysis_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES users(id) NOT NULL,
  task_type    TEXT NOT NULL,  -- 'analyze' | 'test_points' | 'compare'
  input_hash   TEXT NOT NULL,  -- 相同输入30分钟内命中缓存
  status       TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'running' | 'completed' | 'failed'
  input_data   JSONB NOT NULL,
  result_data  JSONB,
  error_message TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_tasks_hash ON analysis_tasks(input_hash, created_at);
```

### 安全架构定稿

```
认证：Auth.js v5 Credentials
├── JWT maxAge: 24小时（原7天→缩短）
├── 签名：HS256, AUTH_SECRET >= 256 bits
├── 吊销：users.token_invalidated_at（改密码/禁用时设NOW()）
├── 暴力破解保护：users.failed_login_count + locked_until（DB级）
└── Cookie: httpOnly + SameSite=Lax

授权：4角色权限矩阵
├── platform_admin: 运维后台全权限
├── project_admin: 项目设置/成员管理
├── editor: 节点/维度/AI分析
└── viewer: 只读

容器间通信：
├── 第一层: X-Internal-Token（共享密钥确认可信服务）
├── 第二层: Authorization: Bearer {user_jwt}（用户身份和权限）
└── FastAPI验证JWT + 查project_members确认权限

数据安全：
├── API Key: AES-256-GCM, 随机12字节IV, {iv}:{ciphertext}:{authTag}
├── 输入校验: Zod(Next.js) + Pydantic(FastAPI)
├── JSONB兜底: CHECK (content IS NOT NULL AND content != '{}'::jsonb)
└── CSRF: Auth.js内置 + Server Actions POST + SameSite cookie
```

### 用户使用流程定稿

```
冷启动（3步，原6步→压缩）：
1. 创建项目选模板 → 自动创建示例数据骨架
2. 浏览示例 → 理解结构和填法
3. 修改/删除示例 → 开始自己的内容

AI分析流程（异步化，原SSE→改为任务模式）：
1. 前端: 上传文件 + 输入需求 → POST → 返回 task_id
2. FastAPI: 后台执行分析 → 结果写入 analysis_tasks 表
3. 前端: 轮询 GET /tasks/{task_id} 获取进度和结果
4. 关tab再回来仍可查看结果
5. 相同输入30分钟缓存

错误处理（三级）：
- 阻塞级（模态框）: 权限/冲突/未登录
- 警告级（banner+重试）: AI超时/网络/保存失败
- 通知级（toast）: 操作成功/非关键提醒

乐观锁冲突：
- v0.1: 提示冲突 + 自动复制编辑到剪贴板 + 刷新最新版本
- v0.2: 双栏diff视图 + 选择/覆盖/合并
```

### 新增文件清单

| 文件 | 用途 |
|------|------|
| `lib/errors.ts` | 三级错误处理 + ErrorSeverity enum |
| `lib/crypto.ts` | API Key AES-256-GCM 加密/解密 |
| `lib/logger.ts` | pino structured logging 配置 |
| `scripts/backup.sh` | pg_dump 每日备份 |
| `scripts/restore.sh` | 备份恢复 |
| `scripts/drizzle-spike.ts` | Drizzle技术验证（用完删除） |

### 163条业务逻辑 → 后端模块映射

| 业务逻辑 | Action | Service | 关键表 |
|----------|--------|---------|-------|
| 1.1-1.10 登录注册 | auth.ts | authService | users |
| 2.1-2.10 项目列表 | project.ts | projectService + permissionService | projects, project_members |
| 3.1-3.10 新建项目 | project.ts | projectService | projects, project_dimension_config, project_members |
| 4.1-4.10 全景图 | project.ts | projectService + nodeService | projects, nodes |
| 5.1-5.5 产品线概览 | node.ts | nodeService | nodes, dimension_records |
| 6.1-6.7 模块概览 | node.ts | nodeService | nodes, dimension_records |
| 7.x 功能档案页 | node.ts + dimension.ts + version.ts | nodeService + dimensionService | nodes, dimension_records, version_records |
| 8.x 需求工作台 | analysis.ts | analyzerClient | analysis_tasks (FastAPI) |
| 9.x 竞品对比 | analysis.ts | analyzerClient | analysis_tasks (FastAPI) |
| 10.x 搜索 | search.ts | searchService | nodes, dimension_records |
| 11.x 项目设置 | settings.ts + member.ts | projectService + memberService | projects, project_dimension_config, project_members |
| 12.x 运维后台 | admin.ts | adminService | users |

---

## 开工前必做清单

### Week 1 Day 1（不可跳过）

- [ ] **Drizzle Spike**（1-2小时）
  - [ ] JSONB字段insert/query/partial update
  - [ ] materialized path LIKE前缀查询性能（100/500/1000节点）
  - [ ] 乐观锁 WHERE version = expected
  - [ ] db.transaction() 嵌套行为
  - [ ] 结果记入ADR-002 "More Information"

### Week 1 之内

- [ ] `openssl rand -base64 33` 生成 AUTH_SECRET，写入 .env
- [ ] `openssl rand -hex 32` 生成 AI_KEY_ENCRYPTION_SECRET，写入 .env
- [ ] scripts/backup.sh + crontab配置
- [ ] lib/logger.ts (pino) 基础配置
- [ ] lib/errors.ts 三级错误enum定义
- [ ] lib/crypto.ts API Key加密/解密

### v0.1 结束前

- [ ] 所有Server Action入口有checkProjectAccess调用
- [ ] users.failed_login_count + locked_until 登录保护
- [ ] ADR-005补充CSRF说明
- [ ] 模板示例数据seed脚本
