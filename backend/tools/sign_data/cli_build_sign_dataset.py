"""Build canonical JSONL sign dataset from source manifests."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from tools.sign_data.io.manifest_loader import load_manifest
from tools.sign_data.sources.arabsign_adapter import iter_arabsign_samples
from tools.sign_data.sources.karsl_adapter import iter_karsl_samples


ADAPTERS = {
    "karsl": iter_karsl_samples,
    "arabsign": iter_arabsign_samples,
}


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--manifest",
        required=True,
        type=Path,
        help="Path to JSON ingestion manifest.",
    )
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Output canonical JSONL file path.",
    )
    return parser


def main() -> int:
    """CLI entry point."""
    parser = _build_parser()
    args = parser.parse_args()
    manifest = load_manifest(args.manifest.resolve())

    output_path = args.output.resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    total = 0
    with output_path.open("w", encoding="utf-8") as handle:
        for source in manifest["sources"]:
            if not isinstance(source, dict):
                raise ValueError("Each source entry in manifest must be an object")
            adapter_name = str(source.get("adapter", source.get("name", ""))).strip().lower()
            if adapter_name not in ADAPTERS:
                raise ValueError(f"Unsupported adapter '{adapter_name}'")
            adapter = ADAPTERS[adapter_name]
            samples = adapter(source)
            for sample in samples:
                handle.write(json.dumps(sample.to_json_dict(), ensure_ascii=False) + "\n")
            total += len(samples)

    print(f"Wrote {total} samples to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

