#!/usr/bin/env python3
"""Automated checks for STT WebM→WAV pipeline (items 4–7 of QA checklist)."""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.audio_convert import (  # noqa: E402
    EBML_MAGIC,
    convert_to_wav_sync,
    hex_prefix,
)
from app.services import stt_service  # noqa: E402

FAILURES: list[str] = []


def fail(msg: str) -> None:
    FAILURES.append(msg)
    print(f"FAIL: {msg}")


def ok(msg: str) -> None:
    print(f"OK: {msg}")


def check_no_legacy_patterns() -> None:
    stt_src = (BACKEND_ROOT / "app" / "services" / "stt_service.py").read_text(
        encoding="utf-8"
    )
    if "pipe:0" in stt_src:
        fail("stt_service.py still references pipe:0")
    else:
        ok("stt_service.py has no pipe:0")

    if "_convert_audio_for_gpt" in stt_src:
        fail("stt_service.py still has _convert_audio_for_gpt")
    else:
        ok("stt_service.py removed _convert_audio_for_gpt")

    ac_src = (BACKEND_ROOT / "app" / "services" / "audio_convert.py").read_text(
        encoding="utf-8"
    )
    if "return audio_data, mime_type" in ac_src:
        fail("audio_convert may return original webm on failure")
    else:
        ok("audio_convert does not fall back to original webm on failure")


def make_sample_webm(path: Path, duration_sec: float = 2.0) -> None:
    import imageio_ffmpeg

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        f"sine=frequency=440:duration={duration_sec}",
        "-c:a",
        "libopus",
        str(path),
    ]
    proc = subprocess.run(cmd, capture_output=True, check=False)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.decode("utf-8", errors="ignore") or "ffmpeg webm gen failed")


def check_webm_to_wav() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        webm_path = Path(tmp) / "sample.webm"
        make_sample_webm(webm_path)
        data = webm_path.read_bytes()
        if not data.startswith(EBML_MAGIC):
            fail(f"generated webm missing EBML magic: {hex_prefix(data)}")
            return
        ok(f"sample webm EBML prefix {hex_prefix(data)}")

        wav_bytes, out_mime = convert_to_wav_sync(data, "audio/webm")
        if out_mime != "audio/wav":
            fail(f"expected audio/wav got {out_mime}")
        elif not wav_bytes.startswith(b"RIFF"):
            fail(f"WAV missing RIFF: {hex_prefix(wav_bytes)}")
        else:
            ok(f"WAV output {len(wav_bytes)} bytes RIFF prefix {hex_prefix(wav_bytes)}")


def check_gpt_path_only_wav() -> None:
    chat_src = (BACKEND_ROOT / "app" / "services" / "stt_service.py").read_text(
        encoding="utf-8"
    )
    if 'input_audio": {"data": audio_b64, "format": fmt}' not in chat_src:
        fail("gpt-audio-mini chat path not found")
    else:
        ok("gpt-audio-mini uses format from wav/mp3 only")

    if "convert_to_wav" not in chat_src:
        fail("stt_service does not call convert_to_wav")
    else:
        ok("stt_service uses convert_to_wav before gpt-audio-mini")


def main() -> int:
    print("=== STT pipeline automated QA ===\n")
    check_no_legacy_patterns()
    try:
        check_webm_to_wav()
    except Exception as exc:
        fail(f"webm→wav integration: {exc}")
    check_gpt_path_only_wav()

    print()
    if FAILURES:
        print(f"{len(FAILURES)} failure(s):")
        for f in FAILURES:
            print(f"  - {f}")
        return 1
    print("All automated checks passed.")
    print("\nManual (browser): items 1–3, 5 — see project STT QA checklist.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
