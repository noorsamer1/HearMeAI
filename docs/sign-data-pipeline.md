# Arabic Sign Data Pipeline

This document defines the Phase 1 (fast) and Phase 3 (production) data flow for
Saudi-focused Arabic sign generation.

## Scope

- Phase 1: ingest KArSL + ArabSign and produce canonical training data quickly.
- Phase 3: normalize all data into one schema with gloss, handshape,
  non-manual markers, timing, and provenance.

## Directory Structure

```text
backend/
  tools/sign_data/
    cli_build_sign_dataset.py
    normalize_to_schema.py
    validate_schema.py
    io/manifest_loader.py
    sources/karsl_adapter.py
    sources/arabsign_adapter.py
  tools/sign_training/
    train_phase1_baseline.py
    export_motion_vocab.py
  artifacts/sign/
    motion_vocab.json
    pose_transition_stats.json
```

## Step 1: Build Canonical Dataset JSONL

Create an ingestion manifest (JSON):

```json
{
  "sources": [
    {
      "name": "karsl",
      "adapter": "karsl",
      "root_dir": "/absolute/path/to/KArSL-100",
      "video_glob": "**/*.mp4",
      "split": "train",
      "variant": "arsl_sa",
      "language": "ar",
      "source_subset": "KArSL-100"
    },
    {
      "name": "arabsign",
      "adapter": "arabsign",
      "root_dir": "/absolute/path/to/ArabSign",
      "video_glob": "**/*.mp4",
      "split": "train",
      "variant": "arsl_sa",
      "language": "ar",
      "source_subset": "ArabSign"
    }
  ]
}
```

Run:

```bash
cd backend
python -m tools.sign_data.cli_build_sign_dataset \
  --manifest /absolute/path/to/sign_ingestion_manifest.json \
  --output /absolute/path/to/data/canonical_sign_samples.jsonl
```

## Step 2: Normalize to Production Schema

```bash
cd backend
python -m tools.sign_data.normalize_to_schema \
  --input /absolute/path/to/data/canonical_sign_samples.jsonl \
  --output /absolute/path/to/data/sign_schema_v1.jsonl \
  --default-license "Research/Manual-Review-Required"
```

## Step 3: Validate and Report

```bash
cd backend
python -m tools.sign_data.validate_schema \
  --input /absolute/path/to/data/sign_schema_v1.jsonl \
  --report-output /absolute/path/to/docs/sign-data-reports/schema_validation_report.json
```

## Step 4: Train CPU Baseline and Export Artifacts

```bash
cd backend
python -m tools.sign_training.train_phase1_baseline \
  --input /absolute/path/to/data/sign_schema_v1.jsonl \
  --output-dir /absolute/path/to/backend/artifacts/sign \
  --seed 42 \
  --max-samples 10000

python -m tools.sign_training.export_motion_vocab \
  --artifacts-dir /absolute/path/to/backend/artifacts/sign \
  --output /absolute/path/to/backend/artifacts/sign/motion_vocab_summary.json
```

## Realtime Integration

`app/api/v1/endpoints/ws_session.py` now prefers artifact-backed planning
(`artifacts/sign/motion_vocab.json`, `artifacts/sign/pose_transition_stats.json`)
before falling back to the LLM planner.

## Saudi-First Variant Policy

- Default variant is `arsl_sa`.
- New datasets must include explicit variant tags when merged.
- Mixed corpora should be tagged `arsl_mixed` until region-specific review.

