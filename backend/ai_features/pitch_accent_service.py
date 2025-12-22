"""
Pitch Accent Service using Fugashi (MeCab wrapper) for Japanese morphological analysis.

This module provides Japanese text tokenization and pitch accent pattern lookup
using the Kanjium database.
"""

import json
import os
import re
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
from pathlib import Path
from typing import Optional

import fugashi

# Constants
KATAKANA_TO_HIRAGANA_OFFSET = ord('ぁ') - ord('ァ')

# Particles that attach to previous word for pitch accent purposes
PARTICLES = {'は', 'が', 'を', 'に', 'へ', 'で', 'と', 'の', 'や', 'か', 'も', 'ね', 'よ', 'わ', 'ぞ', 'ぜ'}

# Mora patterns (combined sounds that count as single mora)
MORA_PATTERNS = [
    # Contracted sounds (拗音) - must come before single kana
    r'[きぎしじちぢにひびぴみり][ゃゅょ]',
    r'[キギシジチヂニヒビピミリ][ャュョ]',
    # Small kana combinations
    r'[ふフ][ぁぃぅぇぉァィゥェォ]',
    r'[うウ][ぃィ]',
    r'[てテ][ぃィ]',
    r'[でデ][ぃィ]',
    r'[とト][ぅゥ]',
    r'[どド][ぅゥ]',
    # Single kana (including small tsu and long vowel mark)
    r'[ぁ-んァ-ヴー]',
]

MORA_REGEX = re.compile('|'.join(MORA_PATTERNS))


class PitchPattern(Enum):
    """Japanese pitch accent patterns."""
    HEIBAN = 'heiban'       # Flat pattern (0) - Low-High-High...
    ATAMADAKA = 'atamadaka' # Head-high (1) - High-Low-Low...
    NAKADAKA = 'nakadaka'   # Middle-high (2+) - Low-High...Low
    ODAKA = 'odaka'         # Tail-high - Low-High-High (drops on particle)
    UNKNOWN = 'unknown'     # Cannot determine


@dataclass
class MoraInfo:
    """Information about a single mora."""
    mora: str
    pitch: str  # 'H' or 'L'
    is_accented: bool


@dataclass
class WordPitchInfo:
    """Complete pitch accent information for a word."""
    word: str
    reading: str
    pitch_number: Optional[int]
    pattern: PitchPattern
    morae: list[MoraInfo]


class PitchAccentService:
    """
    Service for analyzing Japanese pitch accents using Fugashi.
    
    Uses a singleton pattern with lazy initialization for the tagger
    and dictionary loading.
    """
    
    _instance: Optional['PitchAccentService'] = None
    _tagger: Optional[fugashi.Tagger] = None
    _pitch_dict: Optional[dict] = None
    _kanji_readings: Optional[dict] = None
    
    def __new__(cls) -> 'PitchAccentService':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def tagger(self) -> fugashi.Tagger:
        """Lazy-load the Fugashi tagger."""
        if self._tagger is None:
            self._tagger = fugashi.Tagger()
        return self._tagger
    
    @property
    def pitch_dict(self) -> dict:
        """Lazy-load the pitch accent dictionary."""
        if self._pitch_dict is None:
            self._pitch_dict = self._load_pitch_dict()
        return self._pitch_dict
    
    @property
    def kanji_readings(self) -> dict:
        """Lazy-load the kanji readings dictionary."""
        if self._kanji_readings is None:
            self._kanji_readings = self._load_kanji_readings()
        return self._kanji_readings
    
    def _get_data_path(self, filename: str) -> Path:
        """Get the path to a data file."""
        base_dir = Path(__file__).parent.parent / 'data'
        return base_dir / filename
    
    def _load_pitch_dict(self) -> dict:
        """Load the Kanjium pitch accent dictionary."""
        path = self._get_data_path('pitch-accent-dict.json')
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Pitch accent dictionary not found at {path}")
            return {}
    
    def _load_kanji_readings(self) -> dict:
        """Load the kanji readings dictionary."""
        path = self._get_data_path('kanji-readings.json')
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Kanji readings dictionary not found at {path}")
            return {}
    
    @staticmethod
    def katakana_to_hiragana(text: str) -> str:
        """Convert katakana to hiragana."""
        result = []
        for char in text:
            code = ord(char)
            # Katakana range: ァ (0x30A1) to ヴ (0x30F4)
            if 0x30A1 <= code <= 0x30F4:
                result.append(chr(code + KATAKANA_TO_HIRAGANA_OFFSET))
            elif char == 'ー':  # Long vowel mark stays the same
                result.append(char)
            else:
                result.append(char)
        return ''.join(result)
    
    @staticmethod
    def contains_kanji(text: str) -> bool:
        """Check if text contains kanji characters."""
        for char in text:
            code = ord(char)
            # CJK Unified Ideographs and extensions
            if (0x4E00 <= code <= 0x9FFF or   # CJK Unified
                0x3400 <= code <= 0x4DBF or   # CJK Extension A
                0x20000 <= code <= 0x2A6DF):  # CJK Extension B
                return True
        return False
    
    @staticmethod
    def text_to_morae(text: str) -> list[str]:
        """Split Japanese text into individual mora."""
        return MORA_REGEX.findall(text)
    
    def get_token_reading(self, surface: str, mecab_reading: Optional[str]) -> str:
        """
        Get the hiragana reading for a token.
        
        Priority:
        1. MeCab reading (converted to hiragana)
        2. Kanji readings dictionary lookup
        3. Surface form (converted to hiragana)
        """
        # If MeCab provides a reading, use it
        if mecab_reading and mecab_reading != '*':
            return self.katakana_to_hiragana(mecab_reading)
        
        # If surface contains kanji, try dictionary lookup
        if self.contains_kanji(surface):
            reading = self.kanji_readings.get(surface)
            if reading:
                return self.katakana_to_hiragana(reading)
        
        # Fallback to surface form
        return self.katakana_to_hiragana(surface)
    
    def lookup_pitch_accent(self, word: str, reading: str) -> Optional[int]:
        """
        Look up pitch accent number from the Kanjium dictionary.
        
        Returns the pitch accent number (downstep position) or None if not found.
        0 = heiban (flat), 1 = atamadaka, 2+ = nakadaka/odaka
        """
        # Normalize reading to hiragana
        reading_hiragana = self.katakana_to_hiragana(reading)
        
        # Dictionary format is flat: key -> pitch_number
        # Try reading first (most reliable)
        if reading_hiragana in self.pitch_dict:
            return self.pitch_dict[reading_hiragana]
        
        # Try word/surface form
        if word in self.pitch_dict:
            return self.pitch_dict[word]
        
        return None
    
    def get_pitch_pattern(self, pitch_number: Optional[int], mora_count: int) -> PitchPattern:
        """Determine the pitch pattern type from the pitch number."""
        if pitch_number is None:
            return PitchPattern.UNKNOWN
        
        if pitch_number == -1:
            # Particle - follows previous word's pitch
            return PitchPattern.UNKNOWN
        
        if pitch_number == 0:
            return PitchPattern.HEIBAN
        elif pitch_number == 1:
            return PitchPattern.ATAMADAKA
        elif pitch_number == mora_count:
            return PitchPattern.ODAKA
        else:
            return PitchPattern.NAKADAKA
    
    def generate_pitch_heights(self, morae: list[str], pitch_number: Optional[int]) -> list[MoraInfo]:
        """
        Generate pitch height information for each mora.
        
        Rules:
        - Heiban (0): First mora low, rest high
        - Atamadaka (1): First mora high, rest low
        - Nakadaka (n): First mora low, high until n, then low
        - Odaka (n=mora_count): First mora low, all high (drops on particle)
        """
        if not morae:
            return []
        
        mora_count = len(morae)
        result: list[MoraInfo] = []
        
        # Default to heiban if unknown
        if pitch_number is None:
            pitch_number = 0
        
        for i, mora in enumerate(morae):
            position = i + 1  # 1-indexed position
            
            if pitch_number == 0:
                # Heiban: Low-High-High...
                pitch = 'L' if position == 1 else 'H'
                is_accented = False
            elif pitch_number == 1:
                # Atamadaka: High-Low-Low...
                pitch = 'H' if position == 1 else 'L'
                is_accented = position == 1
            else:
                # Nakadaka/Odaka: Low-High...High-Low...
                if position == 1:
                    pitch = 'L'
                elif position <= pitch_number:
                    pitch = 'H'
                else:
                    pitch = 'L'
                is_accented = position == pitch_number
            
            result.append(MoraInfo(mora=mora, pitch=pitch, is_accented=is_accented))
        
        return result
    
    def tokenize(self, text: str) -> list[dict]:
        """
        Tokenize Japanese text using Fugashi.
        
        Returns list of token dictionaries with surface, reading, and POS info.
        """
        tokens = []
        
        for word in self.tagger(text):
            # Get basic info
            surface = word.surface
            
            # Get reading from UniDic features
            # UniDic provides reading in various fields depending on the version
            reading = None
            if hasattr(word, 'feature') and word.feature:
                # Try to get kana reading from features
                # UniDic-lite format: pos1,pos2,pos3,pos4,cType,cForm,lForm,lemma,orth,pron,orthBase,pronBase,...
                features = word.feature
                if hasattr(features, 'kana'):
                    reading = features.kana
                elif hasattr(features, 'pron'):
                    reading = features.pron
                elif hasattr(features, 'lemma'):
                    # Fallback to lemma if no reading
                    pass
            
            # Get POS info
            pos = ''
            pos_detail = ''
            if hasattr(word, 'feature') and word.feature:
                if hasattr(word.feature, 'pos1'):
                    pos = word.feature.pos1 or ''
                if hasattr(word.feature, 'pos2'):
                    pos_detail = word.feature.pos2 or ''
            
            tokens.append({
                'surface': surface,
                'reading': reading,
                'pos': pos,
                'pos_detail': pos_detail,
            })
        
        return tokens
    
    def analyze(self, text: str) -> list[dict]:
        """
        Analyze pitch accent for Japanese text.
        
        Returns a list of WordPitchInfo dictionaries ready for JSON serialization.
        """
        if not text or not text.strip():
            return []
        
        tokens = self.tokenize(text)
        results: list[dict] = []
        
        for token in tokens:
            surface = token['surface']
            
            # Skip whitespace and punctuation
            if not surface.strip() or re.match(r'^[\s\u3000、。！？「」『』（）・…ー]+$', surface):
                continue
            
            # Get reading
            reading = self.get_token_reading(surface, token.get('reading'))
            
            # Split into morae
            morae = self.text_to_morae(reading)
            
            if not morae:
                continue
            
            # Look up pitch accent
            pitch_number = self.lookup_pitch_accent(surface, reading)
            
            # Determine pattern
            pattern = self.get_pitch_pattern(pitch_number, len(morae))
            
            # Generate mora info
            mora_info = self.generate_pitch_heights(morae, pitch_number)
            
            results.append({
                'word': surface,
                'reading': reading,
                'pitchNumber': pitch_number,
                'pattern': pattern.value,
                'morae': [
                    {
                        'mora': m.mora,
                        'pitch': m.pitch,
                        'isAccented': m.is_accented,
                    }
                    for m in mora_info
                ],
            })
        
        return results


# Singleton instance getter
def get_pitch_accent_service() -> PitchAccentService:
    """Get the singleton PitchAccentService instance."""
    return PitchAccentService()
