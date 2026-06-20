#!/usr/bin/env python3
"""Run the HearMeAI model-comparison benchmark and emit JSON + CSV results.

Usage (from backend/, with venv active and OPENROUTER_API_KEY set):

    python -m benchmarks.run_model_comparison --services stt,classifier,llm
    python -m benchmarks.run_model_comparison --services camera,tts
    python -m benchmarks.run_model_comparison --services all

Objective metrics (WER, F1, accuracy, latency, cost, JSON-valid rate) are
computed directly. Subjective metrics (helpfulness, instruction-following) use a
documented LLM-as-judge. Outputs land in benchmarks/reports/.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

import httpx

from benchmarks import metrics
from benchmarks.config import (
    DEFAULT_CONFIG,
    REPORTS_DIR,
    BenchmarkConfig,
    LLMModel,
    STTModel,
)

# ── LLM-as-judge rubric (versioned; change the comment when you tune it) ──
# v1: 0-100 helpfulness + instruction-following on accessibility rewrites.
JUDGE_SYSTEM_PROMPT = (
    "You are a strict evaluator of an accessibility assistant for deaf and mute "
    "users. Given a USER prompt and the MODEL response, score two axes from 0 to "
    "100:\n"
    "- helpfulness: does it fully and correctly satisfy the request?\n"
    "- instruction_following: does it obey constraints (language, simplicity, no "
    "stage directions, format)?\n"
    "Respond with ONLY JSON: "
    '{"helpfulness": <int>, "instruction_following": <int>}'
)

CLASSIFIER_SYSTEM_PROMPT = (
    "Classify the user message. Respond with ONLY JSON containing two fields: "
    '"intent" (one of: greeting, request, question, statement, emergency, '
    'farewell) and "emotion" (one of: positive, neutral, sad, angry, anxious).'
)


def _resolve_api_key() -> str:
    """Read OPENROUTER_API_KEY from env or backend settings."""
    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if key:
        return key
    try:
        from app.core.config import get_settings

        return get_settings().openrouter_api_key.strip()
    except Exception:  # noqa: BLE001 - settings optional for offline metric tests
        return ""


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    """Load a JSONL dataset into a list of dicts."""
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if raw and not raw.startswith("//"):
            rows.append(json.loads(raw))
    return rows


def timed(fn: Callable[[], Any]) -> tuple[Any, float]:
    """Run ``fn`` and return (result, elapsed_ms)."""
    start = time.perf_counter()
    result = fn()
    return result, (time.perf_counter() - start) * 1000.0


@dataclass
class ServiceResult:
    """One model's row in a service comparison table."""

    model: str
    metrics: dict[str, Any]


# ──────────────────────────────────────────────────────────────────────────
# Speech-to-Text
# ──────────────────────────────────────────────────────────────────────────
def _openrouter_transcribe(
    client: httpx.Client, cfg: BenchmarkConfig, api_key: str,
    model_id: str, audio_bytes: bytes, audio_format: str, lang: str | None,
) -> str:
    """Call OpenRouter /audio/transcriptions (JSON base64) for one clip."""
    payload: dict[str, Any] = {
        "model": model_id,
        "input_audio": {
            "data": base64.b64encode(audio_bytes).decode("ascii"),
            "format": audio_format,
        },
    }
    if lang and lang != "auto":
        payload["language"] = lang
    resp = client.post(
        f"{cfg.openrouter_base_url.rstrip('/')}/audio/transcriptions",
        headers={"Authorization": f"Bearer {api_key}",
                 "Content-Type": "application/json"},
        json=payload,
        timeout=90.0,
    )
    resp.raise_for_status()
    return str(resp.json().get("text", "")).strip()


def run_stt(cfg: BenchmarkConfig, api_key: str) -> list[ServiceResult]:
    """Benchmark each STT model: WER/CER (EN & AR), latency, cost."""
    clips = load_jsonl(cfg.stt_manifest)
    results: list[ServiceResult] = []
    with httpx.Client() as client:
        for model in cfg.stt_models:
            per_lang_wer: dict[str, list[float]] = {"en": [], "ar": []}
            cers: list[float] = []
            latencies: list[float] = []
            for clip in clips:
                audio_path = (cfg.stt_manifest.parent / clip["audio_path"])
                if not audio_path.exists():
                    continue
                lang = clip.get("lang", "auto")
                ref = metrics.normalize_text(
                    clip["reference"], strip_tashkeel=(lang == "ar")
                )
                fmt = audio_path.suffix.lstrip(".").lower() or "wav"
                try:
                    hyp_raw, ms = timed(
                        lambda: _openrouter_transcribe(
                            client, cfg, api_key, model.model_id,
                            audio_path.read_bytes(), fmt, lang,
                        )
                    )
                except Exception as exc:  # noqa: BLE001 - keep run alive
                    print(f"  ! {model.name} failed on {clip['audio_path']}: {exc}")
                    continue
                hyp = metrics.normalize_text(
                    hyp_raw, strip_tashkeel=(lang == "ar")
                )
                wer = metrics.word_error_rate(ref, hyp)
                cers.append(metrics.char_error_rate(ref, hyp))
                latencies.append(ms)
                if lang in per_lang_wer:
                    per_lang_wer[lang].append(wer)

            lat = metrics.latency_percentiles(latencies)
            results.append(ServiceResult(model.name, {
                "wer_en_pct": _mean_pct(per_lang_wer["en"]),
                "wer_ar_pct": _mean_pct(per_lang_wer["ar"]),
                "cer_pct": _mean_pct(cers),
                "p95_latency_ms": lat.p95_ms,
                "mean_latency_ms": lat.mean_ms,
                "cost_per_1k_min_usd": model.price_per_1k_min,
                "clips_scored": lat.count,
            }))
            print(f"  · STT {model.name}: {lat.count} clips, "
                  f"WER_en={results[-1].metrics['wer_en_pct']}%")
    return results


# ──────────────────────────────────────────────────────────────────────────
# Classifier (intent / emotion)
# ──────────────────────────────────────────────────────────────────────────
def _openrouter_chat_json(
    client: httpx.Client, cfg: BenchmarkConfig, api_key: str,
    model_id: str, system: str, user: str,
) -> tuple[str, dict[str, int]]:
    """Call an OpenRouter chat model and return (raw_text, usage_tokens)."""
    resp = client.post(
        f"{cfg.openrouter_base_url.rstrip('/')}/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model_id,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0,
        },
        timeout=60.0,
    )
    resp.raise_for_status()
    data = resp.json()
    text = data["choices"][0]["message"]["content"] or ""
    usage = data.get("usage", {}) or {}
    return text.strip(), {
        "prompt_tokens": int(usage.get("prompt_tokens", 0)),
        "completion_tokens": int(usage.get("completion_tokens", 0)),
    }


def _extract_json(text: str) -> dict[str, Any] | None:
    """Best-effort parse of a JSON object embedded in model text."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if 0 <= start < end:
            try:
                return json.loads(text[start: end + 1])
            except json.JSONDecodeError:
                return None
    return None


def run_classifier(cfg: BenchmarkConfig, api_key: str) -> list[ServiceResult]:
    """Benchmark classifier models: intent/emotion F1, JSON-valid, latency, cost."""
    rows = load_jsonl(cfg.classifier_set)
    results: list[ServiceResult] = []
    with httpx.Client() as client:
        for model in cfg.classifier_models:
            intent_true, intent_pred = [], []
            emo_true, emo_pred = [], []
            raw_outputs, latencies, call_costs = [], [], []
            for row in rows:
                try:
                    (raw, usage), ms = timed(
                        lambda: _openrouter_chat_json(
                            client, cfg, api_key, model.model_id,
                            CLASSIFIER_SYSTEM_PROMPT, row["text"],
                        )
                    )
                except Exception as exc:  # noqa: BLE001
                    print(f"  ! {model.name} failed: {exc}")
                    continue
                raw_outputs.append(raw)
                latencies.append(ms)
                call_costs.append(metrics.token_cost(
                    usage["prompt_tokens"], usage["completion_tokens"],
                    model.price_in_per_1m, model.price_out_per_1m,
                ))
                parsed = _extract_json(raw) or {}
                intent_true.append(row["intent"])
                intent_pred.append(str(parsed.get("intent", "")))
                emo_true.append(row["emotion"])
                emo_pred.append(str(parsed.get("emotion", "")))

            intent_rep = metrics.classification_report(intent_true, intent_pred)
            emo_rep = metrics.classification_report(emo_true, emo_pred)
            lat = metrics.latency_percentiles(latencies)
            results.append(ServiceResult(model.name, {
                "intent_f1_pct": round(intent_rep.macro_f1 * 100, 1),
                "emotion_f1_pct": round(emo_rep.macro_f1 * 100, 1),
                "json_valid_pct": round(metrics.valid_json_rate(raw_outputs) * 100, 1),
                "p95_latency_ms": lat.p95_ms,
                "cost_per_1k_calls_usd": round(metrics.cost_per_1k_calls(call_costs), 4),
                "samples": lat.count,
            }))
            print(f"  · Classifier {model.name}: intent F1="
                  f"{results[-1].metrics['intent_f1_pct']}%")
    return results


# ──────────────────────────────────────────────────────────────────────────
# LLM (helpfulness / instruction-following via LLM-judge)
# ──────────────────────────────────────────────────────────────────────────
def run_llm(cfg: BenchmarkConfig, api_key: str) -> list[ServiceResult]:
    """Benchmark chat models: judge scores, latency, cost."""
    prompts = load_jsonl(cfg.llm_prompts)
    results: list[ServiceResult] = []
    with httpx.Client() as client:
        for model in cfg.llm_models:
            help_scores, follow_scores, latencies, call_costs = [], [], [], []
            for item in prompts:
                try:
                    (raw, usage), ms = timed(
                        lambda: _openrouter_chat_json(
                            client, cfg, api_key, model.model_id,
                            item.get("system", "You are a helpful assistant."),
                            item["prompt"],
                        )
                    )
                except Exception as exc:  # noqa: BLE001
                    print(f"  ! {model.name} failed: {exc}")
                    continue
                latencies.append(ms)
                call_costs.append(metrics.token_cost(
                    usage["prompt_tokens"], usage["completion_tokens"],
                    model.price_in_per_1m, model.price_out_per_1m,
                ))
                verdict = _judge(client, cfg, api_key, item["prompt"], raw)
                if verdict:
                    help_scores.append(verdict["helpfulness"])
                    follow_scores.append(verdict["instruction_following"])

            lat = metrics.latency_percentiles(latencies)
            results.append(ServiceResult(model.name, {
                "helpfulness_pct": _mean_pct(
                    [s / 100 for s in help_scores]),
                "instruction_following_pct": _mean_pct(
                    [s / 100 for s in follow_scores]),
                "mean_latency_ms": lat.mean_ms,
                "cost_per_1k_calls_usd": round(metrics.cost_per_1k_calls(call_costs), 4),
                "samples": lat.count,
            }))
            print(f"  · LLM {model.name}: helpfulness="
                  f"{results[-1].metrics['helpfulness_pct']}%")
    return results


def _judge(
    client: httpx.Client, cfg: BenchmarkConfig, api_key: str,
    prompt: str, response: str,
) -> dict[str, int] | None:
    """Score one response with the LLM-judge; returns parsed JSON or None."""
    try:
        raw, _ = _openrouter_chat_json(
            client, cfg, api_key, cfg.judge_model_id,
            JUDGE_SYSTEM_PROMPT,
            f"USER prompt:\n{prompt}\n\nMODEL response:\n{response}",
        )
    except Exception as exc:  # noqa: BLE001
        print(f"  ! judge failed: {exc}")
        return None
    parsed = _extract_json(raw)
    if not parsed:
        return None
    try:
        return {
            "helpfulness": int(parsed["helpfulness"]),
            "instruction_following": int(parsed["instruction_following"]),
        }
    except (KeyError, TypeError, ValueError):
        return None


# ──────────────────────────────────────────────────────────────────────────
# Camera facial sentiment (local production model + heuristic)
# ──────────────────────────────────────────────────────────────────────────
def run_camera(cfg: BenchmarkConfig, _api_key: str) -> list[ServiceResult]:
    """Benchmark the local camera models: accuracy + latency from labeled frames."""
    import asyncio

    from app.services.facial_sentiment_service import analyze_facial_sentiment

    frames = load_jsonl(cfg.camera_manifest)
    y_true, y_pred, latencies = [], [], []
    for frame in frames:
        img_path = cfg.camera_manifest.parent / frame["image_path"]
        if not img_path.exists():
            continue
        b64 = base64.b64encode(img_path.read_bytes()).decode("ascii")
        try:
            result, ms = timed(
                lambda: asyncio.run(analyze_facial_sentiment(b64))
            )
        except Exception as exc:  # noqa: BLE001
            print(f"  ! camera failed on {frame['image_path']}: {exc}")
            continue
        y_true.append(frame["label"])
        y_pred.append(result.label)
        latencies.append(ms)

    rep = metrics.classification_report(y_true, y_pred)
    lat = metrics.latency_percentiles(latencies)
    return [ServiceResult("ViT Face Expression (production)", {
        "accuracy_pct": round(rep.accuracy * 100, 1),
        "macro_f1_pct": round(rep.macro_f1 * 100, 1),
        "mean_latency_ms": lat.mean_ms,
        "frames_scored": lat.count,
    })]


# ──────────────────────────────────────────────────────────────────────────
# Text-to-Speech (production latency via backend)
# ──────────────────────────────────────────────────────────────────────────
def run_tts(cfg: BenchmarkConfig, _api_key: str) -> list[ServiceResult]:
    """Measure production TTS latency through the running backend."""
    samples = [
        ("en", "Hello, how are you today?"),
        ("ar", "مرحبا، كيف حالك اليوم؟"),
    ]
    latencies: list[float] = []
    with httpx.Client(timeout=60.0) as client:
        for lang, text in samples:
            try:
                _, ms = timed(lambda: client.post(
                    f"{cfg.backend_base_url}/api/v1/text-to-speech",
                    json={"text": text, "language": lang},
                ).raise_for_status())
                latencies.append(ms)
            except Exception as exc:  # noqa: BLE001
                print(f"  ! TTS failed ({lang}): {exc}")
    lat = metrics.latency_percentiles(latencies)
    return [ServiceResult("Edge Neural (production)", {
        "p95_latency_ms": lat.p95_ms,
        "mean_latency_ms": lat.mean_ms,
        "samples": lat.count,
        "note": "MOS is collected separately via human rating (see README).",
    })]


# ──────────────────────────────────────────────────────────────────────────
# Helpers + IO
# ──────────────────────────────────────────────────────────────────────────
def _mean_pct(fractions: list[float]) -> float:
    """Mean of error/score fractions expressed as a rounded percentage."""
    if not fractions:
        return 0.0
    return round(sum(fractions) / len(fractions) * 100, 1)


def write_reports(all_results: dict[str, list[ServiceResult]]) -> tuple[Path, Path]:
    """Write combined JSON + per-service CSV; return the two paths."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    json_path = REPORTS_DIR / f"model_comparison_{ts}.json"
    csv_path = REPORTS_DIR / f"model_comparison_{ts}.csv"

    payload = {
        "generated_utc": ts,
        "services": {
            svc: [{"model": r.model, **r.metrics} for r in rows]
            for svc, rows in all_results.items()
        },
    }
    json_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        for svc, rows in all_results.items():
            writer.writerow([f"# {svc}"])
            if rows:
                headers = ["model", *rows[0].metrics.keys()]
                writer.writerow(headers)
                for r in rows:
                    writer.writerow([r.model, *[r.metrics.get(h) for h in headers[1:]]])
            writer.writerow([])
    return json_path, csv_path


RUNNERS: dict[str, Callable[[BenchmarkConfig, str], list[ServiceResult]]] = {
    "stt": run_stt,
    "classifier": run_classifier,
    "llm": run_llm,
    "camera": run_camera,
    "tts": run_tts,
}


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="HearMeAI model comparison benchmark")
    parser.add_argument(
        "--services",
        default="all",
        help="Comma list: stt,classifier,llm,camera,tts or 'all'",
    )
    parser.add_argument(
        "--backend-url", default=DEFAULT_CONFIG.backend_base_url,
        help="Running backend base URL (for camera/tts)",
    )
    return parser.parse_args()


def main() -> int:
    """Entry point: run the requested service benchmarks and write reports."""
    args = parse_args()
    cfg = DEFAULT_CONFIG
    cfg.backend_base_url = args.backend_url
    api_key = _resolve_api_key()

    requested = (
        list(RUNNERS) if args.services == "all"
        else [s.strip() for s in args.services.split(",") if s.strip()]
    )
    needs_key = {"stt", "classifier", "llm"}
    if needs_key & set(requested) and not api_key:
        print("ERROR: OPENROUTER_API_KEY is required for stt/classifier/llm.")
        return 1

    all_results: dict[str, list[ServiceResult]] = {}
    for svc in requested:
        runner = RUNNERS.get(svc)
        if runner is None:
            print(f"Skipping unknown service: {svc}")
            continue
        print(f"\n=== Running {svc} benchmark ===")
        all_results[svc] = runner(cfg, api_key)

    json_path, csv_path = write_reports(all_results)
    print(f"\nSaved:\n  {json_path}\n  {csv_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
