import os
import json
import re
import logging
from typing import Dict, Tuple, Optional, List, Any

logger = logging.getLogger(__name__)

# Absolute path to the translations.json file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRANSLATIONS_FILE = os.path.join(BASE_DIR, "translations.json")

# Internal cache for hot-reloading
_CACHED_TRANSLATIONS: Dict[str, str] = {}
_CACHED_SORTED_KEYS: List[str] = []
_LAST_MTIME: float = 0.0


def _is_metadata_or_header(key: str, value: Any) -> bool:
    """Filter out comments, separators and empty values from the translation mapping."""
    if not isinstance(key, str) or not isinstance(value, str):
        return True
    key_str = key.strip()
    val_str = value.strip()
    if key_str.startswith("_") or key_str.startswith("===") or key_str.startswith("#"):
        return True
    if not val_str:
        return True
    return False


def load_translations_from_disk() -> Dict[str, str]:
    """Load and parse translations from translations.json."""
    if not os.path.exists(TRANSLATIONS_FILE):
        logger.warning(f"Translations file not found at {TRANSLATIONS_FILE}")
        return {}

    try:
        with open(TRANSLATIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        cleaned: Dict[str, str] = {}
        for k, v in data.items():
            if not _is_metadata_or_header(k, v):
                cleaned[k.strip().lower()] = v.strip()

        return cleaned
    except Exception as e:
        logger.error(f"Error loading {TRANSLATIONS_FILE}: {e}")
        return {}


def get_translations() -> Dict[str, str]:
    """
    Returns the current dictionary of translations.
    Automatically hot-reloads if translations.json was modified on disk.
    """
    global _CACHED_TRANSLATIONS, _CACHED_SORTED_KEYS, _LAST_MTIME

    current_mtime = 0.0
    if os.path.exists(TRANSLATIONS_FILE):
        try:
            current_mtime = os.path.getmtime(TRANSLATIONS_FILE)
        except OSError:
            current_mtime = 0.0

    if current_mtime != _LAST_MTIME or not _CACHED_TRANSLATIONS:
        fresh_dict = load_translations_from_disk()
        if fresh_dict:
            _CACHED_TRANSLATIONS = fresh_dict
            _CACHED_SORTED_KEYS = sorted(_CACHED_TRANSLATIONS.keys(), key=len, reverse=True)
            _LAST_MTIME = current_mtime
            logger.info(f"Loaded {len(_CACHED_TRANSLATIONS)} translations from {TRANSLATIONS_FILE} (mtime={current_mtime})")

    return _CACHED_TRANSLATIONS


def get_sorted_keys() -> List[str]:
    """Returns translation keys sorted by length (descending) to match longest phrases first."""
    get_translations()
    return _CACHED_SORTED_KEYS


def reload_translations() -> Dict[str, str]:
    """Forces an immediate reload of translations from disk."""
    global _LAST_MTIME
    _LAST_MTIME = 0.0
    return get_translations()


def translate_query(query: str) -> Tuple[str, Optional[str]]:
    """
    Translates a search query from German/English/Romaji into Japanese.
    
    If query already contains Japanese characters (Kanji/Kana) or is purely numeric (JAN code),
    it is returned as-is.

    Returns:
        (translated_query, original_matched_term_or_None)
    """
    q_clean = query.strip()
    if not q_clean:
        return "", None

    # If Japanese characters or purely digits (JAN/barcode), do not translate
    if any("\u3040" <= c <= "\u30ff" or "\u4e00" <= c <= "\u9fff" for c in q_clean) or q_clean.isdigit():
        return q_clean, None

    translations = get_translations()
    sorted_keys = get_sorted_keys()

    q_lower = q_clean.lower()
    for term in sorted_keys:
        pattern = r"\b" + re.escape(term) + r"\b"
        if re.search(pattern, q_lower):
            jp_val = translations[term]
            return jp_val, term

    return q_clean, None


def add_translation(source_term: str, japanese_term: str, save_to_file: bool = True) -> bool:
    """
    Helper to programmatically add or update a translation.
    If save_to_file is True, persists the change into translations.json.
    """
    source_clean = source_term.strip().lower()
    jp_clean = japanese_term.strip()

    if not source_clean or not jp_clean:
        return False

    if save_to_file and os.path.exists(TRANSLATIONS_FILE):
        try:
            with open(TRANSLATIONS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            data[source_clean] = jp_clean
            
            with open(TRANSLATIONS_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            reload_translations()
            return True
        except Exception as e:
            logger.error(f"Failed to save translation to {TRANSLATIONS_FILE}: {e}")
            return False

    return False


# Initial pre-load on module import
get_translations()
