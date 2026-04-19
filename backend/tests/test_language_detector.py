"""Tests for the language detection service."""

import pytest
from app.services.language_detector import compute_readability_score, detect_language, normalize_text


class TestDetectLanguage:
    def test_english_text(self):
        lang, conf = detect_language("Hello, how are you today?")
        assert lang == "en"
        assert conf > 0.7

    def test_arabic_text(self):
        lang, conf = detect_language("مرحبا كيف حالك اليوم؟")
        assert lang == "ar"
        assert conf > 0.7

    def test_empty_text(self):
        lang, conf = detect_language("")
        assert lang == "unknown"
        assert conf == 0.0

    def test_mixed_prefers_dominant(self):
        lang, _ = detect_language("Hello مرحبا Hello world today is great")
        assert lang == "en"


class TestNormalizeText:
    def test_strips_whitespace(self):
        assert normalize_text("  hello  ") == "hello"

    def test_collapses_spaces(self):
        assert normalize_text("hello   world") == "hello world"

    def test_removes_null_bytes(self):
        result = normalize_text("hello\x00world")
        assert "\x00" not in result


class TestReadabilityScore:
    def test_simple_text_high_score(self):
        score = compute_readability_score("The cat sat. I am good. It is fun.")
        assert score > 60

    def test_complex_text_lower_score(self):
        simple = compute_readability_score("Hi. I am well. Good day.")
        complex_text = "The unequivocal manifestation of multidimensional communicative frameworks necessitates paradigmatic reconceptualization of epistemological structures inherent within postmodern discursive formations."
        complex_score = compute_readability_score(complex_text)
        assert simple > complex_score
