# Prism

A project-based product lifecycle analysis platform.

Organize product analysis, technical implementation, testing insights, competitive benchmarking, and engineering experience around feature modules — with full visibility into system structure and data flow.

## Project Structure

```
prism/
├── docs/
│   ├── PRD.md              # Product requirements (link to knowledge base)
│   ├── roadmap.md          # 4-month iteration plan with IDAKE methodology
│   ├── stitch-prompt.md    # Stitch/v0 prototype generation prompts
│   └── adr/                # 9 Architecture Decision Records
│       ├── 001-frontend-framework.md
│       ├── 002-database-and-orm.md
│       ├── 003-server-actions-vs-api-routes.md
│       ├── 004-ai-service-layer.md
│       ├── 005-auth-strategy.md
│       ├── 006-state-management.md
│       ├── 007-pgvector-deferred.md
│       ├── 008-project-ownership-evolution.md
│       └── 009-react-flow-state-separation.md
├── design/
│   └── v0-prototype-v2/    # v0 generated prototype (7 pages)
├── src/                    # Source code (development phase)
└── scripts/                # Utility scripts
```

## Status

**Phase: Prototype Design**

- [x] Pain point analysis
- [x] Core requirements discussion
- [x] Data model design (node tree + dimension registry + JSONB)
- [x] Market research (5 categories, no direct competitor)
- [x] Architecture scenario testing (10 scenarios passed)
- [x] PRD v0.2 (with AC acceptance criteria + IDAKE methodology)
- [x] 9 ADRs (Architecture Decision Records)
- [x] Tech stack confirmed
- [x] 4-month iteration plan (Spec-Driven + Harness + Builder-Breaker)
- [x] Prototype v2: 7 pages (login, projects, overview, feature detail, search, settings, admin)
- [ ] Prototype: remaining 5 views (product line, module, analysis, comparison, test detail)
- [ ] Development
- [ ] Deployment

## Tech Stack (Confirmed)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js 15 (App Router) | React Flow dependency; best AI code generation quality |
| UI | shadcn/ui + Tailwind CSS | v0 native output; code-in-your-hands |
| Visualization | React Flow | Node graphs, relation maps |
| State | TanStack Query + Zustand | Server data vs UI state separation (ADR-006) |
| Backend | Server Actions (primary) | Single-language full-stack; API Routes only for webhook/stream (ADR-003) |
| ORM | Drizzle ORM | SQL-first, JSONB natural (ADR-002) |
| Database | PostgreSQL 16+ | JSONB + full-text search; pgvector deferred to v0.3 (ADR-007) |
| Auth | Auth.js v5 Credentials | Minimal config; password hash is dev responsibility (ADR-005) |
| AI | Custom LLMProvider | Not locked to Vercel AI SDK (ADR-004) |
| Deploy | Docker Compose | Single machine |

## Development Methodology

**IDAKE 5-Step Loop** for every feature:

```
1. Spec    → Write AC (3-10 per feature)
2. Build   → Claude Code generates code based on AC
3. Break   → CY verifies against AC, finds edge cases
4. Fix     → AI fixes → CY re-verifies → loop until all AC pass
5. Evolve  → Lessons learned recorded in Prism itself (dogfooding)
```

**Harness Mechanisms:** progress file for session recovery, doom loop detection (>6 edits = stop), architecture guardrails per version.

## Prototype Pages

| Page | Status | Route |
|------|--------|-------|
| Login | ✅ | /login |
| Project List | ✅ | /projects |
| Project Overview | ✅ | /projects/[id] |
| Feature Detail (archive) | ✅ | / |
| Search Results | ✅ | /search |
| Project Settings | ✅ | /projects/[id]/settings |
| Admin Dashboard | ✅ | /admin |
| Product Line Overview | Pending | /projects/[id]/product-lines/[plId] |
| Module Overview | Pending | /projects/[id]/modules/[moduleId] |
| Requirement Analysis | Pending | /projects/[id]/analysis |
| Competitive Comparison | Pending | /projects/[id]/comparison |
| Test Analysis Detail | Pending | (expanded card in feature detail) |

## Key Features

- **Feature module as atomic unit** — all info organized around feature modules
- **8 dimension cards** — description, user scenarios, tech implementation, design decisions, engineering experience, testing analysis, requirement analysis, competitive reference
- **Version evolution timeline** — track feature changes across releases
- **Requirement analysis + test point generation** — AI analyzes requirements, generates test cases, one-click import to test dimension
- **Competitive comparison matrix** — cross-competitor feature comparison with AI conclusions
- **Pluggable AI** — configure different AI providers per project (Claude/Codex/Kimi)
- **Full visibility** — system structure, data flow, and relationships are all visualized

## Version Plan

| Version | Timeline | Goal |
|---------|----------|------|
| v0.1 MVP | Month 1 | Record, browse, visualize structure |
| v0.2 | Month 2 | Analyze, compare, AI-powered |
| v0.3 | Month 3 | AI-assisted input, semantic search |
| v1.0 | Month 4 | Team support, polish |
