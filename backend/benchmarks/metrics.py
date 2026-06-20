"""Metric primitives for the HearMeAI model-comparison harness.

Every figure in the AI Model Comparison report maps to one function here:

    - Word/Character Error Rate (STT)          -> word_error_rate / char_error_rate
    - Intent / Emotion F1 (classifier)         -> macro_f1 / classification_report
    - Accuracy (camera, classifier)            -> accuracy
    - Latency P50/P95/P99 (all services)       -> latency_percentiles
    - Cost per 1K calls / 1M tokens            -> token_cost / cost_per_1k_calls
    - JSON-valid rate (structured outputs)     -> valid_json_rate

All functions are pure and deterministic so results are reproducible and can be
unit-tested independently of any network call.
"""

from __future__ import annotations

import json
import math
import statistics
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field

# Arabic diacritics (tashkeel) stripped before "plain" WER/CER so the score is
# not dominated by optional vowel marks Whisper rarely emits.
_ARABIC_DIACRITICS = frozenset(
    "\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652\u0670"
)


# ──────────────────────────────────────────────────────────────────────────
# Text normalization
# ──────────────────────────────────────────────────────────────────────────
def strip_diacritics(text: str) -> str:
    """Remove Arabic tashkeel marks from ``text``."""
    return "".join(ch for ch in text if ch not in _ARABIC_DIACRITICS)


def normalize_text(text: str, *, strip_tashkeel: bool = False) -> str:
    """Normalize for fair error-rate scoring (NFKC, lowercase, single spaces).

    Args:
        text: Raw reference or hypothesis string.
        strip_tashkeel: When True, drop Arabic diacritics first.

    Returns:
        Whitespace-collapsed, case-folded, Unicode-normalized text.
    """
    out = unicodedata.normalize("NFKC", text)
    if strip_tashkeel:
        out = strip_diacritics(out)
    return " ".join(out.lower().split())


# ──────────────────────────────────────────────────────────────────────────
# Edit distance — shared by WER and CER
# ──────────────────────────────────────────────────────────────────────────
def levenshtein(a: list[str], b: list[str]) -> int:
    """Levenshtein edit distance between two token sequences (O(len(a)*len(b)))."""
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    curr = [0] * (len(b) + 1)
    for i, tok_a in enumerate(a, start=1):
        curr[0] = i
        for j, tok_b in enumerate(b, start=1):
            cost = 0 if tok_a == tok_b else 1
            curr[j] = min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
        prev, curr = curr, prev
    return prev[-1]


def word_error_rate(reference: str, hypothesis: str) -> float:
    """WER = edit distance over words / number of reference words.

    Returns 0.0 for an empty reference matched by an empty hypothesis, else 1.0.
    """
    ref = reference.split()
    hyp = hypothesis.split()
    if not ref:
        return 0.0 if not hyp else 1.0
    return levenshtein(ref, hyp) / len(ref)


def char_error_rate(reference: str, hypothesis: str) -> float:
    """CER = edit distance over characters / number of reference characters."""
    ref = list(reference)
    hyp = list(hypothesis)
    if not ref:
        return 0.0 if not hyp else 1.0
    return levenshtein(ref, hyp) / len(ref)


# ──────────────────────────────────────────────────────────────────────────
# Classification metrics (intent / emotion / camera)
# ──────────────────────────────────────────────────────────────────────────
@dataclass
class ClassMetrics:
    """Per-class precision / recall / F1 with support count."""

    label: str
    precision: float
    recall: float
    f1: float
    support: int


@dataclass
class ClassificationReport:
    """Aggregate classification metrics over a labeled set."""

    accuracy: float
    macro_f1: float
    weighted_f1: float
    per_class: list[ClassMetrics] = field(default_factory=list)
    confusion: dict[str, dict[str, int]] = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Serialize to plain dict for JSON reporting."""
        return {
            "accuracy": round(self.accuracy, 4),
            "macro_f1": round(self.macro_f1, 4),
            "weighted_f1": round(self.weighted_f1, 4),
            "per_class": [
                {
                    "label": c.label,
                    "precision": round(c.precision, 4),
                    "recall": round(c.recall, 4),
                    "f1": round(c.f1, 4),
                    "support": c.support,
                }
                for c in self.per_class
            ],
            "confusion": self.confusion,
        }


def accuracy(y_true: list[str], y_pred: list[str]) -> float:
    """Fraction of exactly-correct predictions."""
    if not y_true:
        return 0.0
    hits = sum(1 for t, p in zip(y_true, y_pred) if t == p)
    return hits / len(y_true)


def classification_report(
    y_true: list[str], y_pred: list[str]
) -> ClassificationReport:
    """Compute precision/recall/F1 (per class, macro, weighted) and confusion.

    Args:
        y_true: Gold labels.
        y_pred: Model predictions, aligned by index with ``y_true``.

    Raises:
        ValueError: If the two sequences differ in length.
    """
    if len(y_true) != len(y_pred):
        raise ValueError("y_true and y_pred must have equal length")

    labels = sorted(set(y_true) | set(y_pred))
    tp: dict[str, int] = defaultdict(int)
    fp: dict[str, int] = defaultdict(int)
    fn: dict[str, int] = defaultdict(int)
    support: dict[str, int] = defaultdict(int)
    confusion: dict[str, dict[str, int]] = {
        t: {p: 0 for p in labels} for t in labels
    }

    for t, p in zip(y_true, y_pred):
        support[t] += 1
        confusion[t][p] += 1
        if t == p:
            tp[t] += 1
        else:
            fp[p] += 1
            fn[t] += 1

    per_class: list[ClassMetrics] = []
    for label in labels:
        prec_denom = tp[label] + fp[label]
        rec_denom = tp[label] + fn[label]
        precision = tp[label] / prec_denom if prec_denom else 0.0
        recall = tp[label] / rec_denom if rec_denom else 0.0
        f1_denom = precision + recall
        f1 = 2 * precision * recall / f1_denom if f1_denom else 0.0
        per_class.append(
            ClassMetrics(label, precision, recall, f1, support[label])
        )

    total = len(y_true)
    macro_f1 = statistics.mean([c.f1 for c in per_class]) if per_class else 0.0
    weighted_f1 = (
        sum(c.f1 * c.support for c in per_class) / total if total else 0.0
    )
    return ClassificationReport(
        accuracy=accuracy(y_true, y_pred),
        macro_f1=macro_f1,
        weighted_f1=weighted_f1,
        per_class=per_class,
        confusion=confusion,
    )


def macro_f1(y_true: list[str], y_pred: list[str]) -> float:
    """Convenience: macro-averaged F1 only."""
    return classification_report(y_true, y_pred).macro_f1


# ──────────────────────────────────────────────────────────────────────────
# Latency
# ──────────────────────────────────────────────────────────────────────────
@dataclass
class LatencyStats:
    """Latency summary in milliseconds."""

    count: int
    mean_ms: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    min_ms: float
    max_ms: float

    def to_dict(self) -> dict:
        """Serialize rounded values for JSON reporting."""
        return {k: round(v, 2) if isinstance(v, float) else v
                for k, v in self.__dict__.items()}


def _percentile(values: list[float], pct: float) -> float:
    """Nearest-rank percentile (pct in [0, 100]) of ``values``.

    Uses the ceiling rank so the 50th percentile equals the median for
    odd-length samples (e.g. p50 of [100..500] is 300, not 200).
    """
    if not values:
        return 0.0
    ordered = sorted(values)
    rank = max(1, math.ceil(pct / 100.0 * len(ordered)))
    return ordered[min(rank, len(ordered)) - 1]


def latency_percentiles(samples_ms: list[float]) -> LatencyStats:
    """Aggregate raw per-request latencies (ms) into P50/P95/P99 + mean."""
    if not samples_ms:
        return LatencyStats(0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
    return LatencyStats(
        count=len(samples_ms),
        mean_ms=statistics.mean(samples_ms),
        p50_ms=_percentile(samples_ms, 50),
        p95_ms=_percentile(samples_ms, 95),
        p99_ms=_percentile(samples_ms, 99),
        min_ms=min(samples_ms),
        max_ms=max(samples_ms),
    )


# ──────────────────────────────────────────────────────────────────────────
# Cost
# ──────────────────────────────────────────────────────────────────────────
def token_cost(
    input_tokens: int,
    output_tokens: int,
    price_in_per_1m: float,
    price_out_per_1m: float,
) -> float:
    """USD cost of one LLM call from token counts and per-1M-token prices."""
    return (
        input_tokens / 1_000_000 * price_in_per_1m
        + output_tokens / 1_000_000 * price_out_per_1m
    )


def cost_per_1k_calls(per_call_costs_usd: list[float]) -> float:
    """Extrapolate mean per-call cost to a per-1000-calls figure."""
    if not per_call_costs_usd:
        return 0.0
    return statistics.mean(per_call_costs_usd) * 1000


# ──────────────────────────────────────────────────────────────────────────
# Structured-output validity (sign motion JSON, classifier JSON)
# ──────────────────────────────────────────────────────────────────────────
def valid_json_rate(raw_outputs: list[str]) -> float:
    """Fraction of model outputs that parse as JSON (structured-output rate)."""
    if not raw_outputs:
        return 0.0
    valid = 0
    for raw in raw_outputs:
        try:
            json.loads(raw)
            valid += 1
        except (json.JSONDecodeError, TypeError):
            continue
    return valid / len(raw_outputs)
