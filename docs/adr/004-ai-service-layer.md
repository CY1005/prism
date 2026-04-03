# ADR-004: 自定义 LLMProvider 接口，不绑死 Vercel AI SDK

## Status: Accepted

## Context

Prism 需要支持多模型（Claude Code 本地 / Codex API / Kimi API），按项目配置不同 AI 后端。Vercel AI SDK 提供了便捷的流式输出和多模型支持，但：
- SDK 抽象和业务抽象可能不一致
- 接本地模型、私有网关、特殊参数时可能要绕 SDK
- 业务核心绑死第三方 SDK 增加风险

GPT Review 建议："业务核心层自己定义 LLMProvider 接口"。

## Decision

- **业务层**：自定义 `LLMProvider` 接口（analyze / generate / embed），各模型实现该接口
- **UI 层**：流式输出场景可选用 Vercel AI SDK，不强制

```typescript
// 业务层接口（自己定义）
interface LLMProvider {
  analyze(input: AnalysisRequest): Promise<AnalysisResult>
  generate(input: GenerateRequest): Promise<GenerateResult>
  embed?(input: string[]): Promise<number[][]>  // v0.3 才需要
}

// 各模型实现
class ClaudeProvider implements LLMProvider { ... }
class CodexProvider implements LLMProvider { ... }
class KimiProvider implements LLMProvider { ... }
```

## Alternatives

| 方案 | 否决原因 |
|------|----------|
| 全部用 Vercel AI SDK | 业务层绑死 SDK，接私有模型要绕 |
| 完全不用 AI SDK | 流式输出要自己处理 SSE，重复造轮子 |

## Consequences

- **好处**：业务逻辑和 SDK 解耦；新增模型只需实现接口；可测试（mock provider）
- **代价**：多写一层抽象；流式输出需要自己桥接
- **风险**：抽象层设计不好会变成"万能接口"。控制方式：接口只定义 Prism 实际用到的 3 个方法，不做通用 LLM 抽象
