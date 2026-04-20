# Arabic TTS Trial Notes (MSA Saudi Male)

## Candidate dataset

- Name: `arabic-msa-25k-saudi-male-tashkeel`
- Host: Hugging Face
- License: `CC-BY-4.0`
- Type: synthetic speech corpus (not human-recorded)

## Reported dataset profile

- Clips: 25,000
- Total duration: 60.54 hours
- Average clip length: 8.72 seconds
- Audio format: 48 kHz, 16-bit, mono PCM
- Voice: `ar-SA-HamedNeural` (Saudi male), consistent across all clips
- Mean tashkeel density: 0.78
- Categories: 10 balanced categories (2,500 clips each)
- Approx size: 19.5 GB

## Intended use in HearMeAI

1. **Arabic TTS experimentation**
   - Use as a stable Saudi MSA reference set for prosody and pronunciation checks.
2. **Arabic ASR evaluation / bootstrapping**
   - Use full-tashkeel text for alignment and WER/CER analysis.
3. **Diacritization evaluation**
   - Use stripped text as input and full-tashkeel text as target.

## Important limitation

- This dataset is synthetic and should be treated as:
  - excellent for augmentation and bootstrapping, but
  - not a full replacement for human-recorded Arabic corpora in production ASR.

## Immediate app-level change applied

- Arabic default Edge TTS voice in backend config is now Saudi male:
  - `TTS_VOICE_AR=ar-SA-HamedNeural`

This aligns default runtime behavior with the dataset's target voice profile.

## Stage-2 quick evaluation workflow

Use the local round-trip evaluator to measure Arabic quality:

1. Start backend API (`http://localhost:8000`).
2. Run evaluator from `backend/`:

```bash
python tools/arabic_roundtrip_eval.py --max-samples 20
```

3. Optional: evaluate your own sample file:

```bash
python tools/arabic_roundtrip_eval.py \
  --input-file /path/to/arabic_samples.jsonl \
  --max-samples 100 \
  --output reports/arabic_roundtrip_eval_custom.json
```

Notes:

- Supported input formats:
  - `.txt` (one sentence per line)
  - `.jsonl` (any of: `text`, `text_with_tashkeel`, `diacritized_text`, `source_text`)
- Output report contains per-sample metrics and aggregate stats:
  - diacritized/plain `WER`, `CER`
  - tashkeel density and retention ratio
  - TTS estimated duration and STT processing time

## Manifest-native evaluator (split + category metrics)

For dataset-scale runs from a manifest, use:

```bash
python tools/arabic_roundtrip_eval_manifest.py \
  --manifest /path/to/manifest.jsonl \
  --split train \
  --max-samples 500 \
  --per-category-limit 50 \
  --output reports/arabic_roundtrip_eval_manifest_train.json
```

Supported manifest formats:

- `.jsonl` (recommended)
- `.json` (array or object containing `records`/`samples`/`data`/`items`)
- `.csv`

Field auto-detection:

- Text: `text_with_tashkeel`, `diacritized_text`, `text`, `source_text`
- Category: `category`, `topic`, `domain`, `label`
- Split: `split`, `subset`, `partition`

Report includes:

- Overall summary
- `by_split` metrics
- `by_category` metrics
- Per-sample outputs with IDs and error details

### Direct Hugging Face usage (no manual export)

Use your dataset ID directly:

```bash
python tools/arabic_roundtrip_eval_manifest.py \
  --hf-dataset HeshamHaroon/arabic-msa-25k-saudi-male-tashkeel \
  --hf-split train \
  --max-samples 500 \
  --per-category-limit 50 \
  --output reports/arabic_roundtrip_eval_hf_train.json
```

If `datasets` is not installed:

```bash
pip install datasets
```
