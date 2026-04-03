# ADR-007: pgvector 延迟到 v0.3，MVP 纯 PostgreSQL

## Status: Accepted

## Context

Prism 未来需要语义搜索（"搜支付找到收银"）和 AI 知识库检索，pgvector 是 PostgreSQL 原生向量扩展。

GPT Review 指出：pgvector "很可能是'未来可能要用，所以现在先装上'，这类技术最容易提前复杂化 schema、迁移和部署。"

## Decision

- MVP 和 v0.2：纯 PostgreSQL，全文搜索用 pg_trgm + tsvector
- v0.3：确认需要语义搜索时再加 pgvector

## Consequences

- **好处**：MVP 部署简单（标准 PostgreSQL 镜像）；schema 不提前复杂化
- **代价**：v0.3 加 pgvector 需要一次 migration
- **触发条件**：当用户（CY 自己）搜索时发现关键词匹配不够用，明确需要语义匹配时，才加
