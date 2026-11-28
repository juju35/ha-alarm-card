"""Every translation of the integration has exactly the keys and placeholders of the English one."""

import json
import re
from pathlib import Path

import pytest

TRANSLATIONS = Path(__file__).parents[1] / "custom_components" / "alarm_card" / "translations"
PLACEHOLDER = re.compile(r"\{\w+\}")
CYRILLIC = re.compile(r"[Ѐ-ӿ]")
LATIN = re.compile(r"[A-Za-z]")
# Proper names and brands that stay in Latin letters in the Cyrillic text.
LATIN_IN_CYRILLIC = re.compile(r"Home Assistant|Alarm Card|Alarmo")
LANGUAGES = [
    "fr",
    "de",
    "es",
    "it",
    "nl",
    "pt",
    "pl",
    "sr",
    "sr-Latn",
    "ro",
    "da",
    "sv",
    "bg",
    "ru",
    "uk",
    "hu",
    "sk",
    "cs",
    "sl",
    "lv",
    "el",
]


def _load(lang: str) -> dict:
    return json.loads((TRANSLATIONS / f"{lang}.json").read_text(encoding="utf-8"))


def _strings(data: dict, prefix: str = "") -> dict[str, str]:
    strings = {}
    for key, value in data.items():
        if isinstance(value, dict):
            strings |= _strings(value, f"{prefix}{key}.")
        else:
            strings[prefix + key] = value
    return strings


@pytest.mark.parametrize("lang", LANGUAGES)
def test_translation_keys_match_english(lang: str) -> None:
    """The translation has the same keys and placeholders as en.json, with no empty text."""
    english = _strings(_load("en"))
    other = _strings(_load(lang))
    assert other.keys() == english.keys()
    for path, text in other.items():
        assert text.strip(), path
        assert sorted(PLACEHOLDER.findall(text)) == sorted(PLACEHOLDER.findall(english[path])), path


def test_every_translation_file_is_tested() -> None:
    """No translation file is left out of the parity test."""
    assert sorted(p.stem for p in TRANSLATIONS.glob("*.json")) == sorted(["en", *LANGUAGES])


def test_serbian_stays_in_one_script() -> None:
    """sr is Cyrillic and sr-Latn is Latin, apart from names, brands and placeholders."""
    for path, text in _strings(_load("sr")).items():
        assert not LATIN.search(LATIN_IN_CYRILLIC.sub("", PLACEHOLDER.sub("", text))), path
    for path, text in _strings(_load("sr-Latn")).items():
        assert not CYRILLIC.search(text), path
