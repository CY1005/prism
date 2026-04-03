# ADR-001: 选择 Next.js 15 作为前端框架

## Status: Accepted

## Context

Prism 是一个可视化重、CRUD 轻的知识管理平台。核心交互包括模块关系图、版本时间线、功能档案页。开发者为单人（CY），使用 VibeCoding（AI 辅助开发）模式。

关键约束：
- React Flow（关系图核心库）只有 React 版本，锁定了 React 生态
- v0 原型工具直接输出 React/Next.js 代码
- Claude Code 对 Next.js 的代码生成质量最高
- 单机部署，不需要 CDN/Edge

## Decision

选择 Next.js 15（App Router）。

## Alternatives

| 方案 | 否决原因 |
|------|----------|
| React + Vite（纯 CSR） | 需要单独搭路由、无 Server Actions，开发效率低 |
| Vue 3 + Nuxt | React Flow 无官方 Vue 版，AI 生成 Vue 代码质量低于 React |
| Svelte/SvelteKit | 生态最小，可视化库支持差 |

## Consequences

- **好处**：前后端同仓库同语言；Server Actions 省掉 REST API 层；AI 辅助开发效率最高
- **代价**：App Router 学习成本；框架约定多；版本迭代快需要跟进
- **风险**：Server Actions 和 API Routes 边界混乱 → 通过 ADR-003 约束
