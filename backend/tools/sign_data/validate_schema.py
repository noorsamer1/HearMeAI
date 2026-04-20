"""Validate normalized SignSample JSONL and emit quality report."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

# Ensure backend package imports work when running as a script.
BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

from app.schemas.sign_schema import SignSample  # noqa: E402


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="Normalized schema JSONL.")
    parser.add_argument(
        "--report-output",
        type=Path,
        default=Path("docs/sign-data-reports/schema_validation_report.json"),
        help="Validation report output path.",
    )
    return parser


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()
    input_path = args.input.resolve()
    report_output = args.report_output.resolve()
    report_output.parent.mkdir(parents=True, exist_ok=True)

    sample_ids: set[str] = set()
    split_counts: Counter[str] = Counter()
    source_counts: Counter[str] = Counter()
    duplicate_ids: list[str] = []
    errors: list[dict[str, str]] = []
    total = 0

    with input_path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue
            total += 1
            try:
                payload = json.loads(line)
                sample = SignSample.model_validate(payload)
            except Exception as exc:  # noqa: BLE001
                errors.append({"line": str(line_number), "error": str(exc)})
                continue

            if sample.sample_id in sample_ids:
                duplicate_ids.append(sample.sample_id)
            sample_ids.add(sample.sample_id)
            split_counts[sample.split] += 1
            source_counts[sample.license.source_dataset] += 1

    report = {
        "total_rows": total,
        "valid_rows": total - len(errors),
        "invalid_rows": len(errors),
        "duplicate_sample_ids": sorted(set(duplicate_ids)),
        "split_distribution": dict(split_counts),
        "source_distribution": dict(source_counts),
        "errors": errors,
    }

    with report_output.open("w", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)

    print(f"Validation report written to {report_output}")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())

