"""Shared pytest fixtures."""

import os

import pytest

# Set test env vars before importing app modules
os.environ.setdefault("OPENROUTER_API_KEY", "test-key")
os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
