"""Manifest/HF-aware Arabic round-trip evaluator for HearMeAI.

This script is built for dataset-scale evaluation where text prompts are loaded
from a manifest file (jsonl/json/csv) or directly from Hugging Face datasets,
filtered by split/category, and then evaluated through the live backend API
with grouped metrics.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import random
import statistics
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

ARABIC_DIACRITICS = {
    "\u064b",  # fathatan
    "\u064c",  # dammatan
    "\u064d",  # kasratan
    "\u064e",  # fatha
    "\u064f",  # damma
    "\u0650",  # kasra
    "\u0651",  # shadda
    "\u0652",  # sukun
    "\u0670",  # superscript alef
}

TEXT_KEYS = [
    "text_with_tashkeel",
    "diacritized_text",
    "text",
    "source_text",
]
CATEGORY_KEYS = ["category", "topic", "domain", "label"]
SPLIT_KEYS = ["split", "subset", "partition"]
ID_KEYS = ["id", "clip_id", "sample_id", "uid"]


@dataclass
class ManifestRecord:
    """Input manifest record normalized for evaluation."""

    sample_id: str
    split: str
    category: str
    text: str


@dataclass
class SampleResult:
    """One evaluated sample result."""

    sample_id: str
    split: str
    category: str
    source_text: str
    transcript_text: str
    tts_duration_estimate_seconds: float
    stt_processing_time_ms: int
    wer_diacritized: float
    cer_diacritized: float
    wer_plain: float
    cer_plain: float
    source_tashkeel_density: float
    transcript_tashkeel_density: float
    tashkeel_retention_ratio: float
    error: str | None = None


def normalize_spaces(text: str) -> str:
    """Normalize repeated whitespace."""
    return " ".join(text.split())


def strip_diacritics(text: str) -> str:
    """Remove Arabic diacritic marks."""
    return "".join(ch for ch in text if ch not in ARABIC_DIACRITICS)


def tashkeel_density(text: str) -> float:
    """Compute diacritic ratio over total text length."""
    if not text:
        return 0.0
    marks = sum(1 for ch in text if ch in ARABIC_DIACRITICS)
    return marks / len(text)


def levenshtein_distance(a: list[str], b: list[str]) -> int:
    """Compute edit distance between two token sequences."""
    if not a:
        return len(b)
    if not b:
        return len(a)

    previous = list(range(len(b) + 1))
    current = [0] * (len(b) + 1)

    for i, tok_a in enumerate(a, start=1):
        current[0] = i
        for j, tok_b in enumerate(b, start=1):
            cost = 0 if tok_a == tok_b else 1
            current[j] = min(
                previous[j] + 1,
                current[j - 1] + 1,
                previous[j - 1] + cost,
            )
        previous, current = current, previous

    return previous[-1]


def word_error_rate(reference: str, hypothesis: str) -> float:
    """Compute WER with whitespace tokens."""
    ref_tokens = reference.split()
    hyp_tokens = hypothesis.split()
    if not ref_tokens:
        return 0.0 if not hyp_tokens else 1.0
    return levenshtein_distance(ref_tokens, hyp_tokens) / len(ref_tokens)


def char_error_rate(reference: str, hypothesis: str) -> float:
    """Compute CER at char level."""
    ref_chars = list(reference)
    hyp_chars = list(hypothesis)
    if not ref_chars:
        return 0.0 if not hyp_chars else 1.0
    return levenshtein_distance(ref_chars, hyp_chars) / len(ref_chars)


def detect_audio_mime(audio_bytes: bytes) -> str:
    """Detect WAV/MP3 signatures; fallback to octet-stream."""
    if audio_bytes.startswith(b"RIFF"):
        return "audio/wav"
    if audio_bytes.startswith(b"ID3") or audio_bytes[:2] == b"\xff\xfb":
        return "audio/mpeg"
    return "application/octet-stream"


def extract_first(data: dict[str, Any], keys: list[str], default: str = "") -> str:
    """Return first non-empty string value for candidate keys."""
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return default


def parse_json_manifest(manifest: Path) -> list[dict[str, Any]]:
    """Load JSON manifest (list or object with records-like field)."""
    payload = json.loads(manifest.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for candidate in ("records", "samples", "data", "items"):
            value = payload.get(candidate)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    raise ValueError("Unsupported JSON manifest shape.")


def parse_jsonl_manifest(manifest: Path) -> list[dict[str, Any]]:
    """Load JSONL manifest (one JSON object per line)."""
    rows: list[dict[str, Any]] = []
    for raw_line in manifest.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        data = json.loads(line)
        if isinstance(data, dict):
            rows.append(data)
    return rows


def parse_csv_manifest(manifest: Path) -> list[dict[str, Any]]:
    """Load CSV manifest with header row."""
    rows: list[dict[str, Any]] = []
    with manifest.open("r", encoding="utf-8", newline="") as file_obj:
        reader = csv.DictReader(file_obj)
        for row in reader:
            rows.append(dict(row))
    return rows


def load_manifest_records(manifest: Path) -> list[ManifestRecord]:
    """Load and normalize records from supported manifest formats."""
    suffix = manifest.suffix.lower()
    if suffix == ".jsonl":
        raw_records = parse_jsonl_manifest(manifest)
    elif suffix == ".json":
        raw_records = parse_json_manifest(manifest)
    elif suffix == ".csv":
        raw_records = parse_csv_manifest(manifest)
    else:
        raise ValueError("Unsupported manifest type. Use .jsonl, .json, or .csv.")

    records: list[ManifestRecord] = []
    for idx, raw in enumerate(raw_records, start=1):
        text = extract_first(raw, TEXT_KEYS)
        if not text:
            continue

        record = ManifestRecord(
            sample_id=extract_first(raw, ID_KEYS, default=f"row_{idx}"),
            split=extract_first(raw, SPLIT_KEYS, default="unknown"),
            category=extract_first(raw, CATEGORY_KEYS, default="uncategorized"),
            text=normalize_spaces(text),
        )
        if record.text:
            records.append(record)

    return records


def load_hf_records(dataset_id: str, hf_split: str, hf_config: str | None = None) -> list[ManifestRecord]:
    """Load records directly from a Hugging Face dataset split."""
    try:
        from datasets import load_dataset
    except ImportError as exc:
        raise ValueError(
            "datasets package is required for --hf-dataset mode. "
            "Install it with: pip install datasets"
        ) from exc

    dataset = load_dataset(path=dataset_id, name=hf_config, split=hf_split)

    records: list[ManifestRecord] = []
    for idx, raw in enumerate(dataset, start=1):
        if not isinstance(raw, dict):
            continue

        text = extract_first(raw, TEXT_KEYS)
        if not text:
            continue

        records.append(
            ManifestRecord(
                sample_id=extract_first(raw, ID_KEYS, default=f"row_{idx}"),
                split=hf_split,
                category=extract_first(raw, CATEGORY_KEYS, default="uncategorized"),
                text=normalize_spaces(text),
            )
        )

    return records


def filter_records(
    records: list[ManifestRecord],
    split_filter: str,
    categories_filter: set[str],
) -> list[ManifestRecord]:
    """Apply split/category filters."""
    filtered = records
    if split_filter != "all":
        filtered = [r for r in filtered if r.split.lower() == split_filter.lower()]
    if categories_filter:
        normalized = {item.lower() for item in categories_filter}
        filtered = [r for r in filtered if r.category.lower() in normalized]
    return filtered


def sample_records(
    records: list[ManifestRecord],
    max_samples: int,
    per_category_limit: int,
    seed: int,
) -> list[ManifestRecord]:
    """Deterministically sample records with optional category cap."""
    rnd = random.Random(seed)
    shuffled = records[:]
    rnd.shuffle(shuffled)

    if per_category_limit > 0:
        by_category: dict[str, list[ManifestRecord]] = {}
        for record in shuffled:
            by_category.setdefault(record.category, []).append(record)
        reduced: list[ManifestRecord] = []
        for category_records in by_category.values():
            reduced.extend(category_records[:per_category_limit])
        rnd.shuffle(reduced)
        shuffled = reduced

    return shuffled[:max_samples]


def call_tts(client: httpx.Client, base_url: str, text: str) -> tuple[bytes, float]:
    """Call text-to-speech endpoint and decode base64 audio."""
    response = client.post(
        f"{base_url}/api/v1/text-to-speech",
        json={"text": text, "language": "ar"},
    )
    response.raise_for_status()
    payload = response.json()
    audio_bytes = base64.b64decode(payload["audio_base64"])
    duration = float(payload.get("duration_estimate_seconds", 0.0))
    return audio_bytes, duration


def call_stt(client: httpx.Client, base_url: str, audio_bytes: bytes) -> tuple[str, int]:
    """Call speech-to-text endpoint with generated audio."""
    mime = detect_audio_mime(audio_bytes)
    extension = "wav" if mime == "audio/wav" else "mp3" if mime == "audio/mpeg" else "bin"
    files = {"audio": (f"sample.{extension}", audio_bytes, mime)}
    data = {"language": "ar"}
    response = client.post(f"{base_url}/api/v1/speech-to-text", files=files, data=data)
    response.raise_for_status()
    payload = response.json()
    return str(payload.get("text", "")), int(payload.get("processing_time_ms", 0))


def evaluate_record(record: ManifestRecord, client: httpx.Client, base_url: str) -> SampleResult:
    """Evaluate one manifest record through round-trip path."""
    try:
        audio_bytes, tts_duration = call_tts(client, base_url, record.text)
        transcript, stt_ms = call_stt(client, base_url, audio_bytes)

        source_text = normalize_spaces(record.text)
        transcript_text = normalize_spaces(transcript)
        source_plain = normalize_spaces(strip_diacritics(source_text))
        transcript_plain = normalize_spaces(strip_diacritics(transcript_text))

        source_density = tashkeel_density(source_text)
        transcript_density = tashkeel_density(transcript_text)
        retention = transcript_density / source_density if source_density > 0 else 0.0

        return SampleResult(
            sample_id=record.sample_id,
            split=record.split,
            category=record.category,
            source_text=source_text,
            transcript_text=transcript_text,
            tts_duration_estimate_seconds=tts_duration,
            stt_processing_time_ms=stt_ms,
            wer_diacritized=word_error_rate(source_text, transcript_text),
            cer_diacritized=char_error_rate(source_text, transcript_text),
            wer_plain=word_error_rate(source_plain, transcript_plain),
            cer_plain=char_error_rate(source_plain, transcript_plain),
            source_tashkeel_density=source_density,
            transcript_tashkeel_density=transcript_density,
            tashkeel_retention_ratio=retention,
        )
    except Exception as exc:  # noqa: BLE001 - keep batch execution alive
        return SampleResult(
            sample_id=record.sample_id,
            split=record.split,
            category=record.category,
            source_text=record.text,
            transcript_text="",
            tts_duration_estimate_seconds=0.0,
            stt_processing_time_ms=0,
            wer_diacritized=1.0,
            cer_diacritized=1.0,
            wer_plain=1.0,
            cer_plain=1.0,
            source_tashkeel_density=tashkeel_density(record.text),
            transcript_tashkeel_density=0.0,
            tashkeel_retention_ratio=0.0,
            error=str(exc),
        )


def aggregate(results: list[SampleResult]) -> dict[str, Any]:
    """Build global and grouped summary metrics."""
    ok_results = [item for item in results if item.error is None]
    failed_results = [item for item in results if item.error is not None]

    def mean_or_zero(values: list[float]) -> float:
        return statistics.mean(values) if values else 0.0

    def summarize_group(items: list[SampleResult]) -> dict[str, float | int]:
        ok_items = [item for item in items if item.error is None]
        return {
            "total_samples": len(items),
            "successful_samples": len(ok_items),
            "failed_samples": len(items) - len(ok_items),
            "avg_wer_diacritized": mean_or_zero([x.wer_diacritized for x in ok_items]),
            "avg_cer_diacritized": mean_or_zero([x.cer_diacritized for x in ok_items]),
            "avg_wer_plain": mean_or_zero([x.wer_plain for x in ok_items]),
            "avg_cer_plain": mean_or_zero([x.cer_plain for x in ok_items]),
            "avg_tashkeel_retention_ratio": mean_or_zero(
                [x.tashkeel_retention_ratio for x in ok_items]
            ),
            "avg_stt_processing_time_ms": mean_or_zero(
                [float(x.stt_processing_time_ms) for x in ok_items]
            ),
        }

    by_split: dict[str, list[SampleResult]] = {}
    by_category: dict[str, list[SampleResult]] = {}
    for item in results:
        by_split.setdefault(item.split, []).append(item)
        by_category.setdefault(item.category, []).append(item)

    return {
        "overall": {
            "total_samples": len(results),
            "successful_samples": len(ok_results),
            "failed_samples": len(failed_results),
            "avg_wer_diacritized": mean_or_zero([x.wer_diacritized for x in ok_results]),
            "avg_cer_diacritized": mean_or_zero([x.cer_diacritized for x in ok_results]),
            "avg_wer_plain": mean_or_zero([x.wer_plain for x in ok_results]),
            "avg_cer_plain": mean_or_zero([x.cer_plain for x in ok_results]),
            "avg_tashkeel_retention_ratio": mean_or_zero(
                [x.tashkeel_retention_ratio for x in ok_results]
            ),
            "avg_stt_processing_time_ms": mean_or_zero(
                [float(x.stt_processing_time_ms) for x in ok_results]
            ),
        },
        "by_split": {key: summarize_group(val) for key, val in by_split.items()},
        "by_category": {key: summarize_group(val) for key, val in by_category.items()},
    }


def write_report(path: Path, summary: dict[str, Any], results: list[SampleResult]) -> None:
    """Write final JSON report to disk."""
    payload = {
        "summary": summary,
        "samples": [item.__dict__ for item in results],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    """Parse script arguments."""
    parser = argparse.ArgumentParser(
        description="Evaluate Arabic round-trip quality from manifest or Hugging Face dataset."
    )
    parser.add_argument("--manifest", type=Path, default=None, help="Path to .jsonl/.json/.csv")
    parser.add_argument(
        "--hf-dataset",
        default="",
        help="Hugging Face dataset ID (e.g. org/dataset-name).",
    )
    parser.add_argument(
        "--hf-config",
        default="",
        help="Optional Hugging Face dataset config name.",
    )
    parser.add_argument(
        "--hf-split",
        default="train",
        help="Hugging Face split to load when using --hf-dataset (default: train).",
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Backend base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--split",
        default="all",
        help="Split filter (e.g. train/validation/test/all). Default: all",
    )
    parser.add_argument(
        "--categories",
        default="",
        help="Comma-separated category filter. Default: all categories",
    )
    parser.add_argument(
        "--max-samples",
        type=int,
        default=500,
        help="Maximum evaluated samples after filtering (default: 500)",
    )
    parser.add_argument(
        "--per-category-limit",
        type=int,
        default=0,
        help="Optional cap per category before global cap; 0 disables (default: 0)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for deterministic sampling (default: 42)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("reports/arabic_roundtrip_eval_manifest.json"),
        help="Output report path",
    )
    return parser.parse_args()


def main() -> None:
    """Run manifest-based evaluation."""
    args = parse_args()
    categories_filter = {item.strip() for item in args.categories.split(",") if item.strip()}

    using_manifest = args.manifest is not None
    using_hf = bool(args.hf_dataset.strip())
    if using_manifest == using_hf:
        raise SystemExit("Provide exactly one source: --manifest or --hf-dataset")

    if using_manifest:
        all_records = load_manifest_records(args.manifest)
    else:
        hf_config = args.hf_config.strip() or None
        all_records = load_hf_records(
            dataset_id=args.hf_dataset.strip(),
            hf_split=args.hf_split.strip(),
            hf_config=hf_config,
        )

    filtered_records = filter_records(all_records, split_filter=args.split, categories_filter=categories_filter)
    sampled_records = sample_records(
        filtered_records,
        max_samples=args.max_samples,
        per_category_limit=args.per_category_limit,
        seed=args.seed,
    )

    if not sampled_records:
        raise SystemExit("No records matched provided filters.")

    results: list[SampleResult] = []
    with httpx.Client(timeout=120.0) as client:
        for record in sampled_records:
            result = evaluate_record(record, client=client, base_url=args.base_url.rstrip("/"))
            results.append(result)

    summary = aggregate(results)
    write_report(args.output, summary, results)

    print("Manifest round-trip evaluation complete")
    print(f"Input records: {len(all_records)}")
    print(f"Filtered records: {len(filtered_records)}")
    print(f"Evaluated records: {len(sampled_records)}")
    print(f"Report: {args.output}")
    print(json.dumps(summary["overall"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
