"""CPU-first baseline trainer for text/gloss -> pose sequence artifacts.

This baseline intentionally avoids heavy ML dependencies. It learns a
deterministic mapping from normalized text tokens to pose frequencies and
pairwise pose transitions from schema-normalized JSONL data.
"""

from __future__ import annotations

import argparse
import json
import random
from collections import Counter, defaultdict
from pathlib import Path


POSE_FALLBACK = "neutral"


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="Normalized SignSample JSONL.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("artifacts/sign"),
        help="Artifact directory for baseline outputs.",
    )
    parser.add_argument("--seed", type=int, default=42, help="Deterministic random seed.")
    parser.add_argument(
        "--max-samples",
        type=int,
        default=10000,
        help="Cap samples for CPU prototyping.",
    )
    return parser


def _pose_from_gloss(gloss: str) -> str:
    key = gloss.lower()
    mapping = {
        "hello": "wave",
        "thank": "thank-you",
        "thanks": "thank-you",
        "yes": "yes",
        "no": "no",
        "please": "please",
        "help": "help",
        "how": "question",
        "question": "question",
    }
    return mapping.get(key, POSE_FALLBACK)


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()
    random.seed(args.seed)

    input_path = args.input.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    token_pose_counts: dict[str, Counter[str]] = defaultdict(Counter)
    transition_counts: Counter[str] = Counter()
    pose_counts: Counter[str] = Counter()

    total = 0
    with input_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            payload = json.loads(line)
            total += 1
            if total > args.max_samples:
                break

            tokens = payload.get("tokens", [])
            pose_sequence: list[str] = []
            for token_obj in tokens:
                gloss = str(token_obj.get("gloss", "")).strip().lower()
                if not gloss:
                    continue
                pose = _pose_from_gloss(gloss)
                token_pose_counts[gloss][pose] += 1
                pose_counts[pose] += 1
                pose_sequence.append(pose)

            for prev, curr in zip(pose_sequence, pose_sequence[1:]):
                transition_counts[f"{prev}->{curr}"] += 1

    motion_vocab_path = output_dir / "motion_vocab.json"
    transition_stats_path = output_dir / "pose_transition_stats.json"

    motion_vocab = {
        token: counts.most_common(3)
        for token, counts in sorted(token_pose_counts.items())
    }
    transition_stats = {
        "transitions": transition_counts.most_common(),
        "pose_counts": pose_counts.most_common(),
        "fallback_pose": POSE_FALLBACK,
    }

    with motion_vocab_path.open("w", encoding="utf-8") as handle:
        json.dump(motion_vocab, handle, ensure_ascii=False, indent=2)
    with transition_stats_path.open("w", encoding="utf-8") as handle:
        json.dump(transition_stats, handle, ensure_ascii=False, indent=2)

    print(f"Processed {min(total, args.max_samples)} samples")
    print(f"Wrote {motion_vocab_path}")
    print(f"Wrote {transition_stats_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

