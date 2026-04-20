"""ArabSign ingestion adapter.

Expected manifest section example:
{
  "name": "arabsign",
  "root_dir": "/data/ArabSign",
  "video_glob": "**/*.mp4",
  "split": "train",
  "variant": "arsl_sa",
  "language": "ar",
  "source_subset": "ArabSign",
  "sentence_separator": "_"
}
"""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

from tools.sign_data.types import CanonicalSignSample


_SENTENCE_SPLIT_RE = re.compile(r"[_\-\s]+")


def _normalize_sentence(tokens: list[str]) -> str:
    return " ".join(token for token in tokens if token).strip()


def _make_id(dataset_name: str, rel_path: str) -> str:
    payload = f"{dataset_name}:{rel_path}".encode("utf-8")
    return hashlib.sha1(payload).hexdigest()[:20]


def iter_arabsign_samples(config: dict) -> list[CanonicalSignSample]:
    """Read ArabSign directory using the supplied adapter config."""
    root_dir = Path(config["root_dir"]).expanduser().resolve()
    video_glob = str(config.get("video_glob", "**/*.mp4"))
    split = str(config.get("split", "train"))
    source_subset = str(config.get("source_subset", "arabsign"))
    language = str(config.get("language", "ar"))
    variant = str(config.get("variant", "arsl_sa"))
    dataset_name = str(config.get("name", "arabsign"))

    samples: list[CanonicalSignSample] = []
    for media_path in sorted(root_dir.glob(video_glob)):
        if not media_path.is_file():
            continue
        rel_path = str(media_path.relative_to(root_dir))
        signer_id = media_path.parent.name or "unknown_signer"
        stem_tokens = [t for t in _SENTENCE_SPLIT_RE.split(media_path.stem.lower()) if t]
        gloss = stem_tokens or ["unknown"]
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
                text=_normalize_sentence(gloss),
                media_path=media_path,
                tags=["arabsign", "continuous-sentence"],
                metadata={"relative_path": rel_path},
            )
        )
    return samples

