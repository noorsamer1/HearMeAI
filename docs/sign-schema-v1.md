# Sign Schema v1

Schema implementation lives at:

- `backend/app/schemas/sign_schema.py`

## Core Models

- `TimingSpan`
- `SignToken`
- `HandshapeMarker`
- `NonManualMarker`
- `PoseRef`
- `AnnotationQuality`
- `LicenseMeta`
- `SignSample`

## Required Concepts

`SignSample` captures all production-normalized fields:

- `schema_version`
- `sample_id`
- `language`
- `variant` (`arsl_sa`, `arsl_gulf`, `arsl_mixed`)
- `signer_id`
- `split` (`train`, `val`, `test`, `unspecified`)
- `text`
- `tokens[]` (gloss + timing)
- `handshape_markers[]`
- `non_manual_markers[]`
- `pose_ref`
- `quality`
- `license`
- `metadata`

## Validation Rules

- `TimingSpan.end_ms >= TimingSpan.start_ms`
- frame indices must be non-negative and ordered when provided
- `variant` must be in allowed set
- token timing must be non-decreasing through sequence
- quality coverage scores are constrained to `[0.0, 1.0]`

## Example

```json
{
  "schema_version": "1.0.0",
  "sample_id": "sample_001",
  "language": "ar",
  "variant": "arsl_sa",
  "signer_id": "signer_a",
  "split": "train",
  "text": "hello how are you",
  "tokens": [
    {
      "token_id": "sample_001_0",
      "gloss": "hello",
      "spoken_text": "hello",
      "timing": {"start_ms": 0, "end_ms": 800, "start_frame": null, "end_frame": null}
    }
  ],
  "handshape_markers": [],
  "non_manual_markers": [],
  "pose_ref": {
    "source": "karsl",
    "format": "video",
    "path": "/data/karsl/sample_001.mp4",
    "fps": 30.0,
    "num_frames": 240
  },
  "quality": {
    "source_confidence": 0.5,
    "handshape_coverage": 0.0,
    "non_manual_coverage": 0.0,
    "notes": ["auto-normalized-from-canonical"]
  },
  "license": {
    "source_dataset": "karsl",
    "source_subset": "KArSL-100",
    "license_name": "Research/Manual-Review-Required",
    "license_url": null,
    "attribution_required": true,
    "commercial_use_allowed": null
  },
  "metadata": {}
}
```

