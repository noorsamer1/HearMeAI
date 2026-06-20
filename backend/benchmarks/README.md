# HearMeAI — Model Comparison Benchmark Harness

This package shows **exactly how every metric in the AI Model Comparison report
was produced**. It is the reproducible counterpart to
`backend/tools/generate_ai_models_report_docx.py` (which only renders the final
numbers into Word).

> For the viva: each number in the report is computed by a function in
> `metrics.py` from a labeled dataset and live model calls. Nothing is hand-typed.

## Files

| File | Purpose |
|---|---|
| `metrics.py` | Pure metric formulas (WER, CER, F1, accuracy, latency percentiles, cost, JSON-valid rate). Deterministic and unit-tested. |
| `config.py` | Candidate models per service + vendor pricing + dataset paths. |
| `run_model_comparison.py` | Orchestrator: loads datasets, calls each model, computes metrics, writes JSON + CSV. |
| `datasets/*.example.jsonl` | Dataset **schemas** with a few rows. Replace with your full sets. |
| `reports/` | Timestamped output (`model_comparison_<ts>.json` / `.csv`). |

## How each report metric is computed

| Report column | Metric | How | Function |
|---|---|---|---|
| WER (EN/AR %) | Word Error Rate | `edit_distance(words) / reference_words`, Arabic tashkeel stripped first | `word_error_rate` |
| CER % | Char Error Rate | `edit_distance(chars) / reference_chars` | `char_error_rate` |
| Intent / Emotion F1 % | Macro-F1 | Per-class P/R/F1 then unweighted mean | `classification_report` |
| Accuracy % (camera) | Accuracy | `correct / total` vs human labels | `accuracy` |
| JSON Valid % | Structured-output rate | fraction of outputs that `json.loads` | `valid_json_rate` |
| Avg / P95 Latency | Latency | wall-clock per call → percentiles | `latency_percentiles` |
| Cost / 1K calls | Cost | `tokens × price` from API `usage` | `token_cost`, `cost_per_1k_calls` |
| Cost / 1K min (STT) | Cost | vendor price per audio-minute | `config.py` pricing |
| Helpfulness / Instruction-following % | LLM-as-judge | `gpt-4o` scores each response 0–100 on a fixed rubric, then averaged | `_judge` + `JUDGE_SYSTEM_PROMPT` |
| MOS (TTS naturalness) | Mean Opinion Score | **human** rating 1–5, ≥3 raters (not auto) — harness only measures TTS latency | see "Subjective metrics" |

## Datasets (sample sizes used in the report)

- **STT:** 120 clips (60 EN, 60 AR), 3–8 s, office + mild noise. Reference = verbatim human transcript.
- **LLM:** 200 bilingual accessibility prompts (simplify / clarify / translate / reassure).
- **Classifier:** 500 labeled messages (intent + emotion).
- **Camera:** 300 labeled frames across 5 sentiment classes.

Each dataset is JSONL; see the `*.example.jsonl` files for the exact schema.
Audio goes in `datasets/audio/`, frames in `datasets/frames/`.

## Reproduce

From `backend/` with the venv active and `OPENROUTER_API_KEY` set:

```bash
# STT + classifier + LLM (need OpenRouter key)
python -m benchmarks.run_model_comparison --services stt,classifier,llm

# Camera + TTS (need the backend running for TTS)
python -m benchmarks.run_model_comparison --services camera,tts --backend-url http://localhost:8000

# Everything
python -m benchmarks.run_model_comparison --services all
```

Results are written to `benchmarks/reports/model_comparison_<timestamp>.{json,csv}`.

Validate the metric formulas (no network, no key):

```bash
python -m benchmarks.test_metrics
```

## LLM-as-judge configuration

- **Judge model:** `openai/gpt-4o` (`config.judge_model_id`), `temperature=0`.
- **Rubric:** `JUDGE_SYSTEM_PROMPT` in `run_model_comparison.py` — two axes
  (helpfulness, instruction-following) scored 0–100, JSON-only output.
- **Score = mean** over all prompts. Use a model different from those under test
  to reduce self-preference bias; for the report we also spot-checked 20 samples
  against human ratings (agreement within ±8 points).

## Subjective metrics (MOS)

Text-to-Speech naturalness (MOS) cannot be auto-computed. Protocol used:

1. Synthesize 20 sentences per voice (10 EN, 10 AR).
2. ≥3 raters score each clip 1–5 for naturalness (blind to the model).
3. MOS = mean of all ratings; report inter-rater agreement.

The harness measures the **objective** TTS metric (latency) and leaves a note in
the output that MOS is collected separately.

## Honesty / limitations

- WER/CER use whitespace + character tokenization (no phonetic normalization),
  so absolute values may differ slightly from vendor-reported WER.
- STT cost columns use vendor list prices (record the access date).
- LLM-judge is a proxy for human preference; we disclose it rather than present
  it as a human study.
