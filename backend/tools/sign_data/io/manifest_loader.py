"""Manifest loading utilities for sign data ingestion."""

from __future__ import annotations

import json
from pathlib import Path


def load_manifest(path: Path) -> dict:
    """Load a JSON manifest from disk."""
    if not path.exists():
        raise FileNotFoundError(f"Manifest not found: {path}")
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError("Manifest root must be a JSON object")
    if "sources" not in data or not isinstance(data["sources"], list):
        raise ValueError("Manifest must include a list field named 'sources'")
    return data

