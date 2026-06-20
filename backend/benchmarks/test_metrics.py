#!/usr/bin/env python3
"""Self-checking unit tests for benchmark metric formulas.

Runs without pytest or network access:

    python -m benchmarks.test_metrics

Exits non-zero if any assertion fails, so it can gate CI.
"""

from __future__ import annotations

import math

from benchmarks import metrics


def _close(a: float, b: float, tol: float = 1e-9) -> bool:
    return math.isclose(a, b, rel_tol=0, abs_tol=tol)


def test_wer_and_cer() -> None:
    # One substitution out of three reference words → 1/3.
    assert _close(metrics.word_error_rate("the cat sat", "the cat sit"), 1 / 3)
    # Empty reference, empty hypothesis → 0; empty ref, non-empty hyp → 1.
    assert metrics.word_error_rate("", "") == 0.0
    assert metrics.word_error_rate("", "x") == 1.0
    # One deleted char out of five → 1/5.
    assert _close(metrics.char_error_rate("hello", "helo"), 0.2)


def test_arabic_tashkeel_stripping() -> None:
    diacritized = "مَرْحَبا"
    plain = metrics.normalize_text(diacritized, strip_tashkeel=True)
    assert all(ch not in plain for ch in "\u064e\u0652")


def test_classification_report() -> None:
    y_true = ["a", "b", "a", "b"]
    y_pred = ["a", "b", "b", "b"]
    rep = metrics.classification_report(y_true, y_pred)
    assert _close(rep.accuracy, 0.75)
    # class a: P=1.0 R=0.5 F1=0.667 ; class b: P=0.667 R=1.0 F1=0.8
    assert _close(round(rep.macro_f1, 3), 0.733)
    assert rep.confusion["a"]["b"] == 1


def test_latency_percentiles() -> None:
    stats = metrics.latency_percentiles([100, 200, 300, 400, 500])
    assert stats.p50_ms == 300
    assert stats.p95_ms == 500
    assert _close(stats.mean_ms, 300.0)


def test_cost() -> None:
    # 1000 in @ $0.25/1M + 500 out @ $1.25/1M = 0.00025 + 0.000625.
    assert _close(metrics.token_cost(1000, 500, 0.25, 1.25), 0.000875)
    assert _close(metrics.cost_per_1k_calls([0.001, 0.001]), 1.0)


def test_valid_json_rate() -> None:
    assert _close(metrics.valid_json_rate(['{"a": 1}', "nope", "{}"]), 2 / 3)


def main() -> int:
    """Run every test_* function and report pass/fail."""
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failures = 0
    for test in tests:
        try:
            test()
            print(f"PASS: {test.__name__}")
        except AssertionError as exc:
            failures += 1
            print(f"FAIL: {test.__name__} — {exc}")
    print(f"\n{len(tests) - failures}/{len(tests)} passed")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
