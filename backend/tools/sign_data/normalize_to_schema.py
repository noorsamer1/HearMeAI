"""Normalize canonical JSONL samples into SignSample schema JSONL."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Ensure backend package imports work when running as a script.
BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from app.schemas.sign_schema import (  # noqa: E402
    AnnotationQuality,
    LicenseMeta,
    PoseRef,
    SignSample,
    SignToken,
    TimingSpan,
)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="Canonical JSONL path.")
    parser.add_argument("--output", type=Path, required=True, help="Normalized JSONL path.")
    parser.add_argument(
        "--default-license",
        type=str,
        default="Unknown/Manual",
        help="Default license name when source-specific info is absent.",
    )
    return parser


def _safe_tokens(gloss: list[str]) -> list[str]:
    return [token.strip().lower() for token in gloss if token and token.strip()]


def _sample_to_sign_schema(raw: dict, default_license: str) -> SignSample:
    gloss_tokens = _safe_tokens(list(raw.get("gloss", [])))
    if not gloss_tokens:
        gloss_tokens = ["unknown"]

    token_duration = 800
    sign_tokens: list[SignToken] = []
    for idx, token in enumerate(gloss_tokens):
        start_ms = idx * token_duration
        end_ms = start_ms + token_duration
        sign_tokens.append(
            SignToken(
                token_id=f"{raw.get('sample_id', 'sample')}_{idx}",
                gloss=token,
                spoken_text=token,
                timing=TimingSpan(start_ms=start_ms, end_ms=end_ms),
            )
        )

    pose_ref = None
    media_path = str(raw.get("media_path") or "")
    if media_path:
        pose_ref = PoseRef(
            source=str(raw.get("source_dataset", "unknown")),
            format="video",
            path=media_path,
            fps=raw.get("fps"),
            num_frames=raw.get("num_frames"),
        )

    license_meta = LicenseMeta(
        source_dataset=str(raw.get("source_dataset", "unknown")),
        source_subset=str(raw.get("source_subset", "unknown")),
        license_name=default_license,
        license_url=None,
        attribution_required=True,
        commercial_use_allowed=None,
    )

    return SignSample(
        sample_id=str(raw.get("sample_id", "unknown")),
        language=str(raw.get("language", "ar")),
        variant=str(raw.get("variant", "arsl_sa")),
        signer_id=str(raw.get("signer_id", "unknown_signer")),
        split=str(raw.get("split", "unspecified")),
        text=str(raw.get("text", "")),
        tokens=sign_tokens,
        handshape_markers=[],
        non_manual_markers=[],
        pose_ref=pose_ref,
        quality=AnnotationQuality(
            source_confidence=0.5,
            handshape_coverage=0.0,
            non_manual_coverage=0.0,
            notes=["auto-normalized-from-canonical"],
        ),
        license=license_meta,
        metadata=dict(raw.get("metadata") or {}),
    )


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()
    input_path = args.input.resolve()
    output_path = args.output.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    count = 0
    with input_path.open("r", encoding="utf-8") as src, output_path.open(
        "w", encoding="utf-8"
    ) as dst:
        for line in src:
            line = line.strip()
            if not line:
                continue
            raw = json.loads(line)
            sample = _sample_to_sign_schema(raw, default_license=args.default_license)
            dst.write(json.dumps(sample.model_dump(mode="json"), ensure_ascii=False) + "\n")
            count += 1

    print(f"Normalized {count} samples -> {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

