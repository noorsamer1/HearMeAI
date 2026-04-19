"""Tests for the conversation context manager."""

import pytest
from app.services.context_manager import ConversationContext, ContextRegistry


class TestConversationContext:
    def test_add_and_retrieve(self):
        ctx = ConversationContext("test-session")
        ctx.add("user", "Hello")
        ctx.add("assistant", "Hi there")
        msgs = ctx.get_messages()
        assert len(msgs) == 2
        assert msgs[0]["role"] == "user"
        assert msgs[1]["role"] == "assistant"

    def test_max_messages_sliding_window(self):
        ctx = ConversationContext("test-session", max_messages=5)
        for i in range(10):
            ctx.add("user", f"Message {i}")
        assert len(ctx) <= 5

    def test_empty_text_not_added(self):
        ctx = ConversationContext("test-session")
        ctx.add("user", "")
        ctx.add("user", "   ")
        assert len(ctx) == 0

    def test_language_tracking(self):
        ctx = ConversationContext("test-session")
        ctx.set_language("ar")
        assert ctx.detected_language == "ar"

    def test_clear(self):
        ctx = ConversationContext("test-session")
        ctx.add("user", "Hello")
        ctx.clear()
        assert len(ctx) == 0


class TestContextRegistry:
    def test_get_or_create(self):
        registry = ContextRegistry()
        ctx1 = registry.get_or_create("session-1")
        ctx2 = registry.get_or_create("session-1")
        assert ctx1 is ctx2

    def test_delete(self):
        registry = ContextRegistry()
        registry.get_or_create("session-x")
        registry.delete("session-x")
        assert len(registry) == 0
