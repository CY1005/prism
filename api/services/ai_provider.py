"""Pluggable LLM provider interface (ADR-004).

Supports Claude, Kimi/Moonshot, OpenAI-compatible, and a mock provider
for development/testing.
"""

import json
import logging
from abc import ABC, abstractmethod
from typing import AsyncGenerator

import httpx

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """Abstract LLM provider interface."""

    @abstractmethod
    async def analyze(self, prompt: str, context: str = "") -> AsyncGenerator[str, None]:
        """Stream analysis results token by token."""
        yield ""  # pragma: no cover

    @abstractmethod
    async def generate(self, prompt: str, context: str = "") -> str:
        """Generate a complete response (non-streaming)."""
        ...

    async def embed(self, text: str) -> list[float]:
        """Generate embeddings. Optional — not all providers support this."""
        raise NotImplementedError(f"{self.__class__.__name__} does not support embeddings")


class ClaudeProvider(LLMProvider):
    """Anthropic Claude API provider."""

    API_URL = "https://api.anthropic.com/v1/messages"

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.api_key = api_key
        self.model = model

    async def analyze(self, prompt: str, context: str = "") -> AsyncGenerator[str, None]:
        messages = [{"role": "user", "content": f"{context}\n\n{prompt}" if context else prompt}]
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self.API_URL,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": 4096,
                    "stream": True,
                    "messages": messages,
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        event = json.loads(data)
                        if event.get("type") == "content_block_delta":
                            text = event.get("delta", {}).get("text", "")
                            if text:
                                yield text
                    except json.JSONDecodeError:
                        continue

    async def generate(self, prompt: str, context: str = "") -> str:
        messages = [{"role": "user", "content": f"{context}\n\n{prompt}" if context else prompt}]
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                self.API_URL,
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": 4096,
                    "messages": messages,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["content"][0]["text"]


class KimiProvider(LLMProvider):
    """Kimi/Moonshot API provider (OpenAI-compatible)."""

    API_URL = "https://api.moonshot.cn/v1/chat/completions"

    def __init__(self, api_key: str, model: str = "moonshot-v1-8k"):
        self.api_key = api_key
        self.model = model

    async def _stream_openai_compat(self, prompt: str, context: str) -> AsyncGenerator[str, None]:
        messages = []
        if context:
            messages.append({"role": "system", "content": context})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self.API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "stream": True,
                    "messages": messages,
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        event = json.loads(data)
                        delta = event.get("choices", [{}])[0].get("delta", {})
                        text = delta.get("content", "")
                        if text:
                            yield text
                    except (json.JSONDecodeError, IndexError):
                        continue

    async def analyze(self, prompt: str, context: str = "") -> AsyncGenerator[str, None]:
        async for chunk in self._stream_openai_compat(prompt, context):
            yield chunk

    async def generate(self, prompt: str, context: str = "") -> str:
        messages = []
        if context:
            messages.append({"role": "system", "content": context})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                self.API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": self.model, "messages": messages},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]


class CodexProvider(LLMProvider):
    """OpenAI / Codex API provider."""

    API_URL = "https://api.openai.com/v1/chat/completions"

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model

    async def _stream_openai(self, prompt: str, context: str) -> AsyncGenerator[str, None]:
        messages = []
        if context:
            messages.append({"role": "system", "content": context})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self.API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "stream": True,
                    "messages": messages,
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        event = json.loads(data)
                        delta = event.get("choices", [{}])[0].get("delta", {})
                        text = delta.get("content", "")
                        if text:
                            yield text
                    except (json.JSONDecodeError, IndexError):
                        continue

    async def analyze(self, prompt: str, context: str = "") -> AsyncGenerator[str, None]:
        async for chunk in self._stream_openai(prompt, context):
            yield chunk

    async def generate(self, prompt: str, context: str = "") -> str:
        messages = []
        if context:
            messages.append({"role": "system", "content": context})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                self.API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": self.model, "messages": messages},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]


class DeepSeekProvider(LLMProvider):
    """DeepSeek API provider (OpenAI-compatible)."""

    API_URL = "https://api.deepseek.com/v1/chat/completions"

    def __init__(self, api_key: str, model: str = "deepseek-chat"):
        self.api_key = api_key
        self.model = model

    async def _stream(self, prompt: str, context: str) -> AsyncGenerator[str, None]:
        messages = []
        if context:
            messages.append({"role": "system", "content": context})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                self.API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "stream": True,
                    "messages": messages,
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        event = json.loads(data)
                        delta = event.get("choices", [{}])[0].get("delta", {})
                        text = delta.get("content", "")
                        if text:
                            yield text
                    except (json.JSONDecodeError, IndexError):
                        continue

    async def analyze(self, prompt: str, context: str = "") -> AsyncGenerator[str, None]:
        async for chunk in self._stream(prompt, context):
            yield chunk

    async def generate(self, prompt: str, context: str = "") -> str:
        messages = []
        if context:
            messages.append({"role": "system", "content": context})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                self.API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={"model": self.model, "messages": messages},
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]


class MockProvider(LLMProvider):
    """Mock provider returning realistic test data for dev/frontend work."""

    async def analyze(self, prompt: str, context: str = "") -> AsyncGenerator[str, None]:
        mock_response = self._build_mock_analysis(prompt)
        # Simulate streaming by yielding chunks
        chunk_size = 20
        for i in range(0, len(mock_response), chunk_size):
            yield mock_response[i : i + chunk_size]

    async def generate(self, prompt: str, context: str = "") -> str:
        return self._build_mock_analysis(prompt)

    @staticmethod
    def _build_mock_analysis(prompt: str) -> str:
        short = prompt[:30].replace("\n", " ")
        return (
            f"## 需求分析结果\n\n"
            f"### 影响范围\n"
            f"根据需求「{short}...」的分析，以下模块可能受到影响：\n\n"
            f"1. **用户管理模块** — 需要新增字段或调整权限逻辑\n"
            f"2. **数据存储层** — 数据模型可能需要扩展\n"
            f"3. **API网关** — 接口参数变更\n\n"
            f"### 完整性检查\n"
            f"- ⚠️ 未明确非功能性需求（性能、安全）\n"
            f"- ⚠️ 缺少边界条件描述\n"
            f"- ✅ 核心功能逻辑描述完整\n\n"
            f"### 建议\n"
            f"1. 补充性能指标要求\n"
            f"2. 明确异常场景处理方式\n"
            f"3. 确认与现有功能的兼容性要求\n"
        )


def get_provider(ai_provider: str, api_key: str | None = None) -> LLMProvider:
    """Factory: create an LLMProvider from project settings.

    Args:
        ai_provider: One of "claude", "kimi", "codex", "mock", "local".
        api_key: The decrypted API key (may be None for mock/local).
    """
    provider_map = {
        "claude": ClaudeProvider,
        "kimi": KimiProvider,
        "codex": CodexProvider,
        "deepseek": DeepSeekProvider,
    }

    if ai_provider in ("mock", "local") or not api_key:
        return MockProvider()

    provider_cls = provider_map.get(ai_provider)
    if provider_cls is None:
        logger.warning("Unknown AI provider '%s', falling back to mock", ai_provider)
        return MockProvider()

    return provider_cls(api_key=api_key)
