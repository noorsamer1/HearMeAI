"""Arabic TTS/STT round-trip evaluator for HearMeAI.

This tool benchmarks Arabic text -> TTS -> STT quality using the live backend API.
It is designed for quick local trials while experimenting with Arabic voice and data.
"""

from __future__ import annotations

import argparse
import base64
import json
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

DEFAULT_SAMPLES = [
    "اَلسَّلامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكاتُهُ.",
    "يَسْعى هذا المَشْروعُ إلى تَحْسينِ جَوْدَةِ التَّواصُلِ لِذَوي الإِعاقةِ السَّمْعِيَّةِ.",
    "يُساعِدُ الذَّكاءُ الاصْطِناعِيُّ في تَحْويلِ الكَلامِ إلى نَصٍّ بِدِقَّةٍ عالِيَةٍ.",
    "يَنْبَغِي أَنْ نُوازِنَ بَيْنَ السُّرْعَةِ وَالدِّقَّةِ عِنْدَ تَصْمِيمِ أَنْظِمَةِ الصَّوْتِ.",
    "تُساهِمُ البَياناتُ المُشَكَّلَةُ في تَحْسينِ أَداءِ نَماذِجِ اللُّغَةِ العَرَبِيَّةِ.",
]


@dataclass
class SampleResult:
    """Container for one round-trip evaluation sample."""

    index: int
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


def strip_diacritics(text: str) -> str:
    """Return Arabic text with diacritics removed."""
    return "".join(ch for ch in text if ch not in ARABIC_DIACRITICS)


def normalize_spaces(text: str) -> str:
    """Normalize whitespace to single spaces."""
    return " ".join(text.split())


def tashkeel_density(text: str) -> float:
    """Compute ratio of diacritic marks to total characters."""
    if not text:
        return 0.0
    marks = sum(1 for ch in text if ch in ARABIC_DIACRITICS)
    return marks / len(text)


def levenshtein_distance(a: list[str], b: list[str]) -> int:
    """Compute Levenshtein distance between two token sequences."""
    if not a:
        return len(b)
    if not b:
        return len(a)

    prev = list(range(len(b) + 1))
    curr = [0] * (len(b) + 1)

    for i, token_a in enumerate(a, start=1):
        curr[0] = i
        for j, token_b in enumerate(b, start=1):
            cost = 0 if token_a == token_b else 1
            curr[j] = min(
                prev[j] + 1,       # deletion
                curr[j - 1] + 1,   # insertion
                prev[j - 1] + cost # substitution
            )
        prev, curr = curr, prev

    return prev[-1]


def word_error_rate(reference: str, hypothesis: str) -> float:
    """Compute WER with whitespace tokenization."""
    ref_tokens = reference.split()
    hyp_tokens = hypothesis.split()
    if not ref_tokens:
        return 0.0 if not hyp_tokens else 1.0
    return levenshtein_distance(ref_tokens, hyp_tokens) / len(ref_tokens)


def char_error_rate(reference: str, hypothesis: str) -> float:
    """Compute CER at character level."""
    ref_chars = list(reference)
    hyp_chars = list(hypothesis)
    if not ref_chars:
        return 0.0 if not hyp_chars else 1.0
    return levenshtein_distance(ref_chars, hyp_chars) / len(ref_chars)


def detect_audio_mime(audio_bytes: bytes) -> str:
    """Best-effort MIME detection from byte signature."""
    if audio_bytes.startswith(b"RIFF"):
        return "audio/wav"
    if audio_bytes.startswith(b"ID3") or audio_bytes[:2] == b"\xff\xfb":
        return "audio/mpeg"
    # Fallback: STT endpoint accepts octet-stream
    return "application/octet-stream"


def load_samples(input_file: Path | None, max_samples: int) -> list[str]:
    """Load evaluation texts from txt/jsonl file or built-in defaults."""
    if input_file is None:
        return DEFAULT_SAMPLES[:max_samples]

    suffix = input_file.suffix.lower()
    if suffix == ".txt":
        lines = [normalize_spaces(line.strip()) for line in input_file.read_text(encoding="utf-8").splitlines()]
        lines = [line for line in lines if line]
        return lines[:max_samples]

    if suffix == ".jsonl":
        samples: list[str] = []
        for line in input_file.read_text(encoding="utf-8").splitlines():
            raw = line.strip()
            if not raw:
                continue
            obj = json.loads(raw)
            text = (
                obj.get("text")
                or obj.get("text_with_tashkeel")
                or obj.get("diacritized_text")
                or obj.get("source_text")
            )
            if isinstance(text, str) and text.strip():
                samples.append(normalize_spaces(text.strip()))
            if len(samples) >= max_samples:
                break
        return samples

    raise ValueError("Unsupported input file type. Use .txt or .jsonl")


def call_tts(client: httpx.Client, base_url: str, text: str) -> tuple[bytes, float]:
    """Call TTS endpoint and return audio bytes + duration estimate."""
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
    """Call STT endpoint and return transcript + processing time."""
    mime = detect_audio_mime(audio_bytes)
    extension = "wav" if mime == "audio/wav" else "mp3" if mime == "audio/mpeg" else "bin"
    files = {"audio": (f"sample.{extension}", audio_bytes, mime)}
    data = {"language": "ar"}
    response = client.post(f"{base_url}/api/v1/speech-to-text", files=files, data=data)
    response.raise_for_status()
    payload = response.json()
    return str(payload.get("text", "")), int(payload.get("processing_time_ms", 0))


def evaluate_sample(index: int, text: str, client: httpx.Client, base_url: str) -> SampleResult:
    """Run one round-trip sample and compute metrics."""
    try:
        audio_bytes, tts_duration = call_tts(client, base_url, text)
        transcript, stt_time_ms = call_stt(client, base_url, audio_bytes)

        src_raw = normalize_spaces(text)
        hyp_raw = normalize_spaces(transcript)
        src_plain = normalize_spaces(strip_diacritics(src_raw))
        hyp_plain = normalize_spaces(strip_diacritics(hyp_raw))

        src_density = tashkeel_density(src_raw)
        hyp_density = tashkeel_density(hyp_raw)
        retention_ratio = hyp_density / src_density if src_density > 0 else 0.0

        return SampleResult(
            index=index,
            source_text=src_raw,
            transcript_text=hyp_raw,
            tts_duration_estimate_seconds=tts_duration,
            stt_processing_time_ms=stt_time_ms,
            wer_diacritized=word_error_rate(src_raw, hyp_raw),
            cer_diacritized=char_error_rate(src_raw, hyp_raw),
            wer_plain=word_error_rate(src_plain, hyp_plain),
            cer_plain=char_error_rate(src_plain, hyp_plain),
            source_tashkeel_density=src_density,
            transcript_tashkeel_density=hyp_density,
            tashkeel_retention_ratio=retention_ratio,
        )
    except Exception as exc:  # noqa: BLE001 - keep run alive for all samples
        return SampleResult(
            index=index,
            source_text=text,
            transcript_text="",
            tts_duration_estimate_seconds=0.0,
            stt_processing_time_ms=0,
            wer_diacritized=1.0,
            cer_diacritized=1.0,
            wer_plain=1.0,
            cer_plain=1.0,
            source_tashkeel_density=tashkeel_density(text),
            transcript_tashkeel_density=0.0,
            tashkeel_retention_ratio=0.0,
            error=str(exc),
        )


def summarize(results: list[SampleResult]) -> dict[str, Any]:
    """Build aggregate summary stats."""
    ok_results = [r for r in results if r.error is None]
    failed = [r for r in results if r.error is not None]

    def mean_or_zero(values: list[float]) -> float:
        return statistics.mean(values) if values else 0.0

    return {
        "total_samples": len(results),
        "successful_samples": len(ok_results),
        "failed_samples": len(failed),
        "avg_wer_diacritized": mean_or_zero([r.wer_diacritized for r in ok_results]),
        "avg_cer_diacritized": mean_or_zero([r.cer_diacritized for r in ok_results]),
        "avg_wer_plain": mean_or_zero([r.wer_plain for r in ok_results]),
        "avg_cer_plain": mean_or_zero([r.cer_plain for r in ok_results]),
        "avg_tashkeel_retention_ratio": mean_or_zero([r.tashkeel_retention_ratio for r in ok_results]),
        "avg_tts_duration_estimate_seconds": mean_or_zero(
            [r.tts_duration_estimate_seconds for r in ok_results]
        ),
        "avg_stt_processing_time_ms": mean_or_zero([float(r.stt_processing_time_ms) for r in ok_results]),
    }


def write_report(output_path: Path, summary: dict[str, Any], results: list[SampleResult]) -> None:
    """Write JSON report to disk."""
    payload = {
        "summary": summary,
        "samples": [r.__dict__ for r in results],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Evaluate Arabic round-trip quality (TTS -> STT).")
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Backend base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--input-file",
        type=Path,
        default=None,
        help="Optional .txt or .jsonl file with Arabic input texts.",
    )
    parser.add_argument(
        "--max-samples",
        type=int,
        default=20,
        help="Maximum number of samples to evaluate (default: 20)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("reports/arabic_roundtrip_eval.json"),
        help="Output JSON report path (default: reports/arabic_roundtrip_eval.json)",
    )
    return parser.parse_args()


def main() -> None:
    """Run evaluation pipeline from CLI."""
    args = parse_args()
    samples = load_samples(args.input_file, args.max_samples)
    if not samples:
        raise SystemExit("No samples loaded. Provide non-empty input data.")

    results: list[SampleResult] = []
    with httpx.Client(timeout=90.0) as client:
        for idx, text in enumerate(samples, start=1):
            result = evaluate_sample(idx, text, client, args.base_url.rstrip("/"))
            results.append(result)

    summary = summarize(results)
    write_report(args.output, summary, results)

    print("Arabic round-trip evaluation complete")
    print(f"Report: {args.output}")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
