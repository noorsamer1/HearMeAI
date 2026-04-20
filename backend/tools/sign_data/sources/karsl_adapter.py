"""KArSL ingestion adapter.

Expected manifest section example:
{
  "name": "karsl",
  "root_dir": "/data/KArSL-100",
  "video_glob": "**/*.mp4",
  "split": "train",
  "variant": "arsl_sa",
  "language": "ar",
  "source_subset": "KArSL-100"
}
"""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

from tools.sign_data.types import CanonicalSignSample


_TOKEN_SPLIT_RE = re.compile(r"[_\-\s]+")


def _guess_gloss_from_path(path: Path) -> list[str]:
    stem = path.stem.lower()
    parts = [p for p in _TOKEN_SPLIT_RE.split(stem) if p and not p.isdigit()]
    return parts or ["unknown"]


def _make_id(dataset_name: str, rel_path: str) -> str:
    payload = f"{dataset_name}:{rel_path}".encode("utf-8")
    return hashlib.sha1(payload).hexdigest()[:20]


def iter_karsl_samples(config: dict) -> list[CanonicalSignSample]:
    """Read KArSL directory using the supplied adapter config."""
    root_dir = Path(config["root_dir"]).expanduser().resolve()
    video_glob = str(config.get("video_glob", "**/*.mp4"))
    split = str(config.get("split", "train"))
    source_subset = str(config.get("source_subset", "karsl"))
    language = str(config.get("language", "ar"))
    variant = str(config.get("variant", "arsl_sa"))
    dataset_name = str(config.get("name", "karsl"))

    samples: list[CanonicalSignSample] = []
    for media_path in sorted(root_dir.glob(video_glob)):
        if not media_path.is_file():
            continue
        rel_path = str(media_path.relative_to(root_dir))
        gloss = _guess_gloss_from_path(media_path)
        signer_id = media_path.parent.name or "unknown_signer"
        sample_id = _make_id(dataset_name, rel_path)
        samples.append(
            CanonicalSignSample(
                sample_id=sample_id,
                source_dataset=dataset_name,
                source_subset=source_subset,
                signer_id=signer_id,
                split=split,
                language=language,
                variant=variant,
                gloss=gloss,
                text=" ".join(gloss),
                media_path=media_path,
                tags=["karsl", "isolated-word"],
                metadata={"relative_path": rel_path},
            )
        )
    return samples

