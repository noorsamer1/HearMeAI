"""OpenRouter LLM client with streaming, metrics, and task-specific prompts."""

import json
import time
from typing import AsyncIterator

import httpx

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.core.metrics import metrics
from app.schemas.ai import ConversationMessage

logger = get_logger(__name__)
settings = get_settings()

SYSTEM_PROMPT = """You are an AI communication assistant for deaf and mute individuals.
Your role is to facilitate clear, respectful communication.

Core principles:
- Use clear, simple, and direct language
- Avoid jargon, complex idioms, or ambiguous phrasing
- Be concise — every word matters
- Maintain a calm, supportive, and encouraging tone
- Preserve the original meaning faithfully when rephrasing
- Respond in the same language as the user unless asked to translate

You help with: general conversation, text simplification, clarification, and translation.

Output rules:
- Write only the message the user should read or hear — no stage directions or physical actions.
- Never use asterisk-wrapped action cues (for example *nods politely* or *smiles*).
- Use normal sentence capitalization. Never write your reply in all capital letters."""

TASK_PROMPTS = {
    "simplify": (
        "Rewrite the following text using very simple words and short sentences. "
        "Make it easy to understand for anyone. Preserve the full meaning. "
        "Do not add introductory phrases like 'Here is a simpler version':\n\n{text}"
    ),
    "clarify": (
        "Explain the following text clearly. Add helpful context where needed. "
        "Use simple language. Be concise:\n\n{text}"
    ),
    "translate_to_ar": (
        "Translate the following text to Arabic. Use clear, natural Modern Standard Arabic. "
        "Preserve the meaning exactly:\n\n{text}"
    ),
    "translate_to_en": (
        "Translate the following text to English. Use clear, natural English. "
        "Preserve the meaning exactly:\n\n{text}"
    ),
}


class OpenRouterClient:
    def __init__(self) -> None:
        self._http_client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._http_client is None:
            if not settings.openrouter_api_key:
                raise ValueError("OPENROUTER_API_KEY is not set.")
            self._http_client = httpx.AsyncClient(
                base_url=settings.openrouter_base_url,
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "HTTP-Referer": "https://aca-assistant.app",
                    "X-Title": "AI Communication Assistant",
                    "Content-Type": "application/json",
                },
                timeout=httpx.Timeout(45.0, connect=10.0),
            )
        return self._http_client

    async def stream_chat(
        self,
        messages: list[ConversationMessage | dict],
        system_override: str | None = None,
        *,
        temperature: float | None = None,
    ) -> AsyncIterator[str]:
        """Stream chat completion tokens from OpenRouter."""
        normalized = self._normalize_messages(messages)
        system = system_override or SYSTEM_PROMPT

        payload = {
            "model": settings.openrouter_model,
            "messages": [{"role": "system", "content": system}, *normalized],
            "stream": True,
            "temperature": 0.7 if temperature is None else temperature,
            "max_tokens": 1024,
        }

        client = self._get_client()
        start = time.perf_counter()
        first_token_logged = False

        try:
            async with client.stream("POST", "/chat/completions", json=payload) as response:
                if response.status_code != 200:
                    body = await response.aread()
                    elapsed_ms = int((time.perf_counter() - start) * 1000)
                    metrics.record("llm_stream", elapsed_ms, success=False)
                    raise RuntimeError(
                        f"OpenRouter error {response.status_code}: {body.decode()[:500]}"
                    )

                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                    except json.JSONDecodeError:
                        continue

                    content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    if content:
                        if not first_token_logged:
                            elapsed_ms = int((time.perf_counter() - start) * 1000)
                            logger.debug("LLM first token", ttft_ms=elapsed_ms)
                            metrics.record("llm_ttft", elapsed_ms)
                            first_token_logged = True
                        yield content

            total_ms = int((time.perf_counter() - start) * 1000)
            metrics.record("llm_stream", total_ms, success=True)

        except Exception as exc:
            elapsed_ms = int((time.perf_counter() - start) * 1000)
            metrics.record("llm_stream", elapsed_ms, success=False)
            raise

    async def stream_action(
        self,
        action: str,
        text: str,
        target_language: str | None = None,
    ) -> AsyncIterator[str]:
        """Stream an action (simplify, clarify, translate)."""
        if action == "translate":
            key = "translate_to_ar" if target_language == "ar" else "translate_to_en"
        else:
            key = action

        prompt_template = TASK_PROMPTS.get(key, "{text}")
        prompt = prompt_template.format(text=text)
        messages = [{"role": "user", "content": prompt}]
        system = "You are a precise language assistant. Be concise and accurate. Respond directly without preamble."

        async for token in self.stream_chat(messages, system_override=system):
            yield token

    async def complete(self, messages: list[ConversationMessage | dict]) -> str:
        """Non-streaming completion for short tasks."""
        normalized = self._normalize_messages(messages)
        payload = {
            "model": settings.openrouter_model,
            "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *normalized],
            "stream": False,
            "temperature": 0.5,
            "max_tokens": 512,
        }

        start = time.perf_counter()
        client = self._get_client()
        response = await client.post("/chat/completions", json=payload)

        elapsed_ms = int((time.perf_counter() - start) * 1000)
        metrics.record("llm_complete", elapsed_ms, success=response.is_success)
        response.raise_for_status()

        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def complete_with_model(
        self,
        model: str,
        messages: list[dict],
        *,
        temperature: float = 0.3,
        max_tokens: int = 512,
        json_mode: bool = False,
    ) -> str:
        """Non-streaming completion with an explicit model id (e.g. small classifier)."""
        payload: dict = {
            "model": model,
            "messages": messages,
            "stream": False,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        start = time.perf_counter()
        client = self._get_client()
        response = await client.post("/chat/completions", json=payload)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        metrics.record("llm_complete", elapsed_ms, success=response.is_success)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    def _normalize_messages(self, messages: list) -> list[dict]:
        return [
            {"role": m.role, "content": m.content} if hasattr(m, "role") else m
            for m in messages
        ]

    async def close(self) -> None:
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None


_llm_client: OpenRouterClient | None = None


def get_llm_client() -> OpenRouterClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = OpenRouterClient()
    return _llm_client
