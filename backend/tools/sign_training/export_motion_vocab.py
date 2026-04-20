"""Export and summarize motion vocabulary artifacts."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--artifacts-dir",
        type=Path,
        default=Path("artifacts/sign"),
        help="Directory containing baseline artifacts.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/sign/motion_vocab_summary.json"),
        help="Summary output file.",
    )
    return parser


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()
    artifacts_dir = args.artifacts_dir.resolve()
    output_path = args.output.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    vocab_path = artifacts_dir / "motion_vocab.json"
    transitions_path = artifacts_dir / "pose_transition_stats.json"
    if not vocab_path.exists():
        raise FileNotFoundError(f"Missing artifact: {vocab_path}")
    if not transitions_path.exists():
        raise FileNotFoundError(f"Missing artifact: {transitions_path}")

    with vocab_path.open("r", encoding="utf-8") as handle:
        vocab = json.load(handle)
    with transitions_path.open("r", encoding="utf-8") as handle:
        transitions = json.load(handle)

    summary = {
        "vocab_size": len(vocab),
        "top_tokens": list(vocab.keys())[:50],
        "top_transitions": transitions.get("transitions", [])[:50],
        "fallback_pose": transitions.get("fallback_pose", "neutral"),
    }

    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, ensure_ascii=False, indent=2)

    print(f"Wrote summary to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

