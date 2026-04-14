# Prism

**Feature-centric product knowledge management platform** — organize product analysis, technical decisions, testing insights, and competitive benchmarking around feature modules instead of scattered tools.

Built as a full-stack AI-powered web application using VibeCoding methodology (AI generates, human verifies).

## The Problem

In complex products like AI cloud platforms, knowledge about a single feature is fragmented across 5-6 tools (Confluence, Notion, Jira, Feishu, local notes). Prism consolidates everything into one structured view per feature module.

## Key Features

| Category | Features |
|----------|----------|
| **Core** | Feature module tree with configurable hierarchy, 8-dimension archive page (description, user scenarios, tech implementation, design decisions, engineering experience, test analysis, requirement analysis, competitive reference), version evolution timeline |
| **Analysis** | AI requirement analysis (impact scope + completeness + rationality + test point generation), competitive comparison matrix, project panorama view |
| **AI-Powered** | Pluggable AI providers (Claude / DeepSeek / custom), AI smart import (upload docs -> AI extracts & categorizes -> human review -> batch import), AI snapshot generation, hybrid search (keyword + semantic via pgvector) |
| **Collaboration** | Team/space management, RBAC (admin/editor/viewer), member invitation, import/export (Markdown/JSON/CSV) |

20 features (F1-F20) fully implemented and tested.

## Tech Stack

```
Frontend:  Next.js 15 (App Router) + React 19 + TypeScript
UI:        shadcn/ui + Tailwind CSS 4 + React Flow (relation graphs)
State:     TanStack Query + Zustand
Backend:   FastAPI + SQLAlchemy 2.0 + Pydantic 2
Database:  PostgreSQL 16 + pgvector (semantic search)
Auth:      Auth.js v5 (Credentials)
ORM:       Drizzle ORM (frontend) + SQLAlchemy (backend)
Deploy:    Docker Compose
```

## Architecture

```
┌─────────────────────────────────────────────┐
│              Next.js 15 (App Router)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ React UI │ │ Server   │ │ Auth.js v5   │ │
│  │ shadcn   │ │ Actions  │ │ JWT + RBAC   │ │
│  │ React    │ │ (CRUD)   │ │              │ │
│  │ Flow     │ └────┬─────┘ └──────────────┘ │
│  └──────────┘      │                         │
└────────────────────┼─────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
┌────────┐   ┌────────────┐   ┌────────────┐
│ Drizzle│   │  FastAPI    │   │ PostgreSQL │
│  ORM   │──>│  AI Engine  │──>│   16 +     │
│ (CRUD) │   │ (Analyze/   │   │  pgvector  │
│        │   │  Search/    │   │            │
└────┬───┘   │  Import)    │   └────────────┘
     │       └─────────────┘
     │              │
     └──────────────┘
         Both connect to
         same PostgreSQL
```

**Hybrid architecture**: Next.js handles CRUD and SSR via Server Actions + Drizzle ORM. FastAPI handles AI-intensive workloads (requirement analysis, semantic search, smart import, feed aggregation) as a sidecar service.

## Quick Start

```bash
# Prerequisites: Docker, Node.js 18+

# 1. Clone and configure
git clone <repo-url> && cd prism
cp .env.example .env
# Edit .env: set AUTH_SECRET, AI_KEY_ENCRYPTION_SECRET, INTERNAL_TOKEN

# 2. Start database + API backend
docker-compose up -d

# 3. Start frontend
cd web && npm install && npm run dev

# Open http://localhost:3001
# API docs: http://localhost:8001/docs
```

## Quality Metrics

| Metric | Value |
|--------|-------|
| Test points | 155 (100% pass rate) |
| Bugs tracked | 84 (all resolved) |
| Features | 20 (F1-F20) |
| Architecture Decision Records | 13 (MADR 3.0 format) |
| Backend code | ~8,000 lines Python |
| Frontend code | ~3,400 lines TypeScript |

## Development Methodology

**IDAKE 5-Step Loop** — applied to every feature:

```
1. Spec    → Write acceptance criteria (3-10 per feature)
2. Build   → AI generates code based on AC
3. Break   → Human verifies against AC, finds edge cases
4. Fix     → AI fixes → Human re-verifies → loop until all AC pass
5. Evolve  → Lessons learned recorded in Prism itself (dogfooding)
```

**Harness mechanisms**: session progress recovery, doom loop detection (>6 edits on same file = stop and rethink), architecture guardrails per version.

## Project Documentation

```
docs/
├── product/           # PRD, feature list & user stories
├── adr/               # 13 Architecture Decision Records
├── architecture/      # arc42 tech architecture doc
├── dev-plan/          # Roadmap, parallel dev plan, agent orchestration
├── testing/           # Test plans, bug log (84 bugs), RCA reports
├── business-design/   # Data flow, import process, AI integration
└── ai-prompt/         # Session-based AI prompt engineering
```

## Version History

| Version | Milestone | Status |
|---------|-----------|--------|
| v0.1 | MVP — record, browse, visualize, multi-user | Done |
| v0.2 | Analysis — compare, AI-powered analysis, tracking | Done |
| v0.3 | AI Enhanced — smart import, hybrid search | Done |
| v1.x | Team support, import/export, full test coverage | Done |

## License

Private project. Not open-sourced.
