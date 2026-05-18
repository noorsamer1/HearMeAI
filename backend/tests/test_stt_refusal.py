"""Tests for STT refusal detection and language hints."""

from app.services.stt_service import (
    _arabic_dialect_quality_score,
    _arabic_has_common_mishear,
    _arabic_transcript_needs_refine,
    _arabic_transcript_quality_rank,
    _looks_clear_english_transcript,
    _looks_foreign_latin_not_english,
    _looks_romanized_arabic_latin,
    is_probable_stt_hallucination,
    is_stt_refusal_text,
    normalize_language_hint,
)


def test_normalize_language_hint_arabic() -> None:
    assert normalize_language_hint("ar") == "ar"
    assert normalize_language_hint("ar-SA") == "ar"
    assert normalize_language_hint("auto") is None


def test_is_stt_refusal_text_detects_chat_replies() -> None:
    assert is_stt_refusal_text(
        "Sure, please provide the audio file or link, and I'll transcribe it verbatim."
    )
    assert is_stt_refusal_text(
        "I'm sorry, but I can't transcribe audio in languages other than English."
    )
    assert not is_stt_refusal_text("مرحبا كيف حالك")
    assert not is_stt_refusal_text("Hello, hello.")


def test_clear_english_not_forced_to_arabic_retry() -> None:
    assert _looks_clear_english_transcript("Hello, my name is Nur.")
    assert _looks_clear_english_transcript(".Hello, my name is Nur")
    assert not _looks_clear_english_transcript("kif halak shu akhbarak")
    assert not _looks_clear_english_transcript("مرحبا نور")


def test_romanized_arabic_detection() -> None:
    assert _looks_romanized_arabic_latin("kif halak shu akhbarak")
    assert not _looks_romanized_arabic_latin("Hello, my name is Nur")


def test_arabic_dialect_quality_score() -> None:
    assert _arabic_dialect_quality_score("كيف حالك شو اخبارك") >= 6
    assert _arabic_dialect_quality_score("كفها لك سو أكبارا") < 4
    assert _arabic_dialect_quality_score("مرحباً نور") >= 2


def test_arabic_mishear_triggers_refine() -> None:
    bad = "كيف حالك شوف أورا"
    good = "كيف حالك شو اخبارك"
    assert _arabic_has_common_mishear(bad)
    assert not _arabic_has_common_mishear(good)
    assert _arabic_transcript_needs_refine(bad, "openai/whisper-large-v3-turbo")
    assert _arabic_transcript_quality_rank(good) > _arabic_transcript_quality_rank(bad)


def test_foreign_latin_english_retry() -> None:
    assert _looks_foreign_latin_not_english("Halló, halló, hvað var ég?")
    assert not _looks_foreign_latin_not_english("Hello, my name is Nur.")


def test_stt_hallucination_detection() -> None:
    assert is_probable_stt_hallucination("Alen gefð hællag, gefð sættag.")
    assert is_probable_stt_hallucination("Sæhti, kiaf?")
    assert is_probable_stt_hallucination("Halló, halló, hvað var ég?")
    assert not is_probable_stt_hallucination("Hello, my name is Nur.")
    assert not is_probable_stt_hallucination("كيف حالك، شو اخبارك، كيف صحتك؟")
