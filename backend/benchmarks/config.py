"""Benchmark configuration: candidate models, pricing, and dataset paths.

Edit this file (or pass --config) to control which models are compared and at
what prices. Prices are USD and sourced from each vendor's public pricing page;
record the access date in the report when you refresh them.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

BENCH_ROOT = Path(__file__).resolve().parent
DATASETS_DIR = BENCH_ROOT / "datasets"
REPORTS_DIR = BENCH_ROOT / "reports"


@dataclass(frozen=True)
class LLMModel:
    """An OpenRouter chat model under evaluation."""

    name: str
    model_id: str
    price_in_per_1m: float
    price_out_per_1m: float


@dataclass(frozen=True)
class STTModel:
    """An OpenRouter-hosted transcription model under evaluation."""

    name: str
    model_id: str
    # USD per 1,000 audio-minutes (vendor pricing; used for the cost column).
    price_per_1k_min: float


@dataclass
class BenchmarkConfig:
    """Top-level benchmark settings."""

    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    backend_base_url: str = "http://localhost:8000"
    # Strong model used as the LLM-judge for subjective scores.
    judge_model_id: str = "openai/gpt-4o"

    stt_models: list[STTModel] = field(
        default_factory=lambda: [
            STTModel("Whisper large-v3", "openai/whisper-large-v3", 0.48),
            STTModel(
                "Whisper large-v3-turbo",
                "openai/whisper-large-v3-turbo",
                0.22,
            ),
            STTModel("Whisper-1", "openai/whisper-1", 0.18),
            STTModel(
                "GPT-4o-mini-transcribe",
                "openai/gpt-4o-mini-transcribe",
                0.12,
            ),
        ]
    )
    llm_models: list[LLMModel] = field(
        default_factory=lambda: [
            LLMModel("Claude 3 Haiku", "anthropic/claude-3-haiku", 0.25, 1.25),
            LLMModel(
                "Claude 3.5 Sonnet",
                "anthropic/claude-3.5-sonnet",
                3.00,
                15.00,
            ),
            LLMModel("GPT-4o", "openai/gpt-4o", 2.50, 10.00),
            LLMModel("GPT-4o-mini", "openai/gpt-4o-mini", 0.15, 0.60),
        ]
    )
    classifier_models: list[LLMModel] = field(
        default_factory=lambda: [
            LLMModel("GPT-4o-mini", "openai/gpt-4o-mini", 0.15, 0.60),
            LLMModel("Claude 3 Haiku", "anthropic/claude-3-haiku", 0.25, 1.25),
        ]
    )

    stt_manifest: Path = DATASETS_DIR / "stt_manifest.example.jsonl"
    classifier_set: Path = DATASETS_DIR / "classifier_labeled.example.jsonl"
    llm_prompts: Path = DATASETS_DIR / "llm_prompts.example.jsonl"
    camera_manifest: Path = DATASETS_DIR / "camera_manifest.example.jsonl"


DEFAULT_CONFIG = BenchmarkConfig()
