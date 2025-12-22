/**
 * Japanese Pitch Accent Utilities
 *
 * This module provides two modes of operation:
 * 1. API mode (recommended): Uses backend Fugashi service for faster, more accurate analysis
 * 2. Client mode (fallback): Uses kuromoji.js for offline analysis
 *
 * The API mode is preferred for production as it:
 * - Reduces frontend bundle size
 * - Provides faster analysis (Cython-based Fugashi vs JavaScript kuromoji)
 * - Uses the same Kanjium dictionary (186,000+ entries)
 */

import kuromoji from "kuromoji";

// Re-export API service
export {
  analyzePitchAccentApi,
  analyzePitchAccentDebounced,
} from "../services/pitchAccentApi";

export type PitchPattern =
  | "heiban"
  | "atamadaka"
  | "nakadaka"
  | "odaka"
  | "unknown";

export interface MoraInfo {
  mora: string;
  pitch: "high" | "low";
  isParticle: boolean;
  isDownstep: boolean; // marks the position where pitch drops
}

export interface WordPitchInfo {
  word: string;
  reading: string;
  morae: MoraInfo[];
  pattern: PitchPattern;
  accentPosition: number; // 0 = heiban, 1+ = accent position
}

// Kuromoji tokenizer instance (lazily initialized)
let tokenizerInstance: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null =
  null;
let tokenizerPromise: Promise<
  kuromoji.Tokenizer<kuromoji.IpadicFeatures>
> | null = null;

// Pitch accent dictionary (lazily loaded from JSON)
let pitchAccentDict: Record<string, number> | null = null;
let pitchAccentDictPromise: Promise<Record<string, number>> | null = null;

// Kanji readings dictionary (lazily loaded from JSON)
let kanjiReadingsDict: Record<string, string> | null = null;
let kanjiReadingsDictPromise: Promise<Record<string, string>> | null = null;

/**
 * Load comprehensive pitch accent dictionary from JSON
 * Contains 186,000+ entries from Kanjium database
 */
async function getPitchAccentDict(): Promise<Record<string, number>> {
  if (pitchAccentDict) return pitchAccentDict;

  if (pitchAccentDictPromise) return pitchAccentDictPromise;

  pitchAccentDictPromise = fetch("/data/pitch-accent-dict.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load pitch accent dictionary: ${response.status}`
        );
      }
      return response.json();
    })
    .then((data) => {
      pitchAccentDict = data;
      console.log(
        `Loaded pitch accent dictionary with ${
          Object.keys(data).length
        } entries`
      );
      return data;
    })
    .catch((error) => {
      console.error("Error loading pitch accent dictionary:", error);
      // Return fallback minimal dictionary
      return FALLBACK_DICT;
    });

  return pitchAccentDictPromise;
}

/**
 * Load kanji-to-reading dictionary from JSON
 * Contains 100,000+ kanji word to hiragana mappings
 */
async function getKanjiReadingsDict(): Promise<Record<string, string>> {
  if (kanjiReadingsDict) return kanjiReadingsDict;

  if (kanjiReadingsDictPromise) return kanjiReadingsDictPromise;

  kanjiReadingsDictPromise = fetch("/data/kanji-readings.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Failed to load kanji readings dictionary: ${response.status}`
        );
      }
      return response.json();
    })
    .then((data) => {
      kanjiReadingsDict = data;
      console.log(
        `Loaded kanji readings dictionary with ${
          Object.keys(data).length
        } entries`
      );
      return data;
    })
    .catch((error) => {
      console.error("Error loading kanji readings dictionary:", error);
      return {}; // Return empty dict on failure
    });

  return kanjiReadingsDictPromise;
}

// Minimal fallback dictionary if JSON fails to load
const FALLBACK_DICT: Record<string, number> = {
  // Particles
  が: -1,
  を: -1,
  に: -1,
  で: -1,
  と: -1,
  は: -1,
  も: -1,
  の: -1,
  へ: -1,
  から: -1,
  まで: -1,
  より: -1,
  など: -1,
  けど: -1,
  // Common words
  ねこ: 1,
  いぬ: 2,
  まど: 0,
  そと: 1,
  です: 1,
  ます: 1,
};

/**
 * Initialize kuromoji tokenizer (loads dictionaries)
 */
async function getTokenizer(): Promise<
  kuromoji.Tokenizer<kuromoji.IpadicFeatures>
> {
  if (tokenizerInstance) return tokenizerInstance;

  if (tokenizerPromise) return tokenizerPromise;

  tokenizerPromise = new Promise((resolve, reject) => {
    console.log("Initializing kuromoji tokenizer with dict path: /dict");
    kuromoji.builder({ dicPath: "/dict" }).build((err, tokenizer) => {
      if (err) {
        console.error("Failed to build kuromoji tokenizer:", err);
        reject(err);
      } else {
        console.log("Kuromoji tokenizer initialized successfully");
        tokenizerInstance = tokenizer;
        resolve(tokenizer);
      }
    });
  });

  return tokenizerPromise;
}

// Particles set for highlighting
const PARTICLES = new Set([
  "が",
  "を",
  "に",
  "で",
  "と",
  "から",
  "まで",
  "は",
  "も",
  "や",
  "の",
  "へ",
  "ば",
  "けど",
  "けれど",
  "ので",
  "のに",
  "ながら",
  "ばかり",
  "だけ",
  "しか",
  "こそ",
  "さえ",
  "でも",
  "とか",
  "か",
  "ね",
  "よ",
  "わ",
  "な",
]);

/**
 * Convert Japanese text to mora units
 * Handles small kana (ゃゅょぁぃぅぇぉ etc)
 */
export function textToMorae(text: string): string[] {
  const morae: string[] = [];
  const smallKana = /[ゃゅょぁぃぅぇぉゎっャュョァィゥェォヮッ]/;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    // Check if next char is small kana
    if (nextChar && smallKana.test(nextChar)) {
      morae.push(char + nextChar);
      i++; // skip next char
    } else {
      morae.push(char);
    }
  }

  return morae;
}

/**
 * Determine pitch pattern type based on accent position
 */
export function getPitchPattern(
  accentPosition: number,
  moraCount: number
): PitchPattern {
  if (accentPosition === 0) return "heiban"; // 平板 - no drop
  if (accentPosition === 1) return "atamadaka"; // 頭高 - drop after first
  if (accentPosition === moraCount) return "odaka"; // 尾高 - drop after last
  return "nakadaka"; // 中高 - drop in middle
}

/**
 * Generate pitch heights for a word based on accent position
 * accentPosition: 0 = heiban (no drop), 1+ = position where drop occurs
 */
export function generatePitchHeights(
  moraCount: number,
  accentPosition: number
): Array<"high" | "low"> {
  const heights: Array<"high" | "low"> = [];

  if (accentPosition === 0) {
    // 平板 (heiban): L H H H H... (first low, rest high)
    heights.push("low");
    for (let i = 1; i < moraCount; i++) {
      heights.push("high");
    }
  } else if (accentPosition === 1) {
    // 頭高 (atamadaka): H L L L... (first high, rest low)
    heights.push("high");
    for (let i = 1; i < moraCount; i++) {
      heights.push("low");
    }
  } else {
    // 中高/尾高: L H H... H L L... (low, high until accent, then low)
    heights.push("low");
    for (let i = 1; i < moraCount; i++) {
      heights.push(i < accentPosition ? "high" : "low");
    }
  }

  return heights;
}

/**
 * Analyze text using kuromoji and generate SENTENCE-LEVEL pitch
 * This handles continuous pitch across word boundaries
 * Uses comprehensive Kanjium dictionary (186,000+ entries)
 */
export async function analyzePitchAccent(
  text: string
): Promise<WordPitchInfo[]> {
  if (!text.trim()) return [];

  try {
    // Load tokenizer and dictionaries in parallel
    const [tokenizer, dict, readingsDict] = await Promise.all([
      getTokenizer(),
      getPitchAccentDict(),
      getKanjiReadingsDict(),
    ]);

    const tokens = tokenizer.tokenize(text);
    const result: WordPitchInfo[] = [];

    for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
      const token = tokens[tokenIdx];

      // Get hiragana reading using helper function with readings dictionary fallback
      const reading = getTokenReading(token, readingsDict);
      const word = token.surface_form;

      // Check if it's a particle
      const isParticle = PARTICLES.has(word) || token.pos === "助詞";

      // Look up pitch accent from comprehensive dictionary
      // -1 means particle (follows previous word's pitch)
      let accentPosition = 0;
      const dictValue = dict[reading] ?? dict[word];

      if (dictValue !== undefined) {
        accentPosition = dictValue;
      } else {
        // Heuristics for unknown words (rare with 186k entries)
        const moraCount = textToMorae(reading).length;

        if (isParticle) {
          accentPosition = -1; // particle
        } else if (token.pos === "動詞") {
          accentPosition = moraCount <= 2 ? 1 : 0;
        } else if (token.pos === "形容詞") {
          accentPosition = Math.min(2, moraCount - 1);
        } else if (token.pos === "名詞") {
          accentPosition = moraCount <= 2 ? 1 : 0;
        } else {
          accentPosition = 0; // default heiban
        }
      }

      const morae = textToMorae(reading);
      let pitchHeights: Array<"high" | "low">;

      if (accentPosition === -1 || isParticle) {
        // Particle: follows previous word's ending pitch (usually low after a drop)
        // Particles are typically low after content words
        pitchHeights = morae.map(() => "low" as const);
      } else {
        pitchHeights = generatePitchHeights(morae.length, accentPosition);
      }

      const pattern = getPitchPattern(accentPosition, morae.length);

      const moraInfos: MoraInfo[] = morae.map((mora, idx) => ({
        mora,
        pitch: pitchHeights[idx],
        isParticle,
        isDownstep:
          accentPosition > 0 &&
          idx === accentPosition - 1 &&
          idx < morae.length - 1,
      }));

      result.push({
        word,
        reading,
        morae: moraInfos,
        pattern,
        accentPosition: accentPosition === -1 ? 0 : accentPosition,
      });
    }

    return result;
  } catch (error) {
    console.error("Kuromoji tokenization error:", error);
    return fallbackAnalysis(text);
  }
}

/**
 * Check if a string contains kanji characters
 */
function containsKanji(str: string): boolean {
  return /[\u4E00-\u9FAF\u3400-\u4DBF]/.test(str);
}

/**
 * Convert katakana to hiragana
 */
function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30A1-\u30F6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });
}

/**
 * Get the hiragana reading for a token
 * Uses kuromoji reading, then falls back to kanji readings dictionary
 */
function getTokenReading(
  token: kuromoji.IpadicFeatures,
  readingsDict: Record<string, string>
): string {
  // If kuromoji provides a reading (non-empty), use it (convert from katakana to hiragana)
  if (
    token.reading &&
    token.reading.trim().length > 0 &&
    token.reading !== "*"
  ) {
    return katakanaToHiragana(token.reading);
  }

  // If pronunciation is available (non-empty), use it
  if (
    token.pronunciation &&
    token.pronunciation.trim().length > 0 &&
    token.pronunciation !== "*"
  ) {
    return katakanaToHiragana(token.pronunciation);
  }

  // If surface_form doesn't contain kanji, it's safe to use directly
  if (!containsKanji(token.surface_form)) {
    return token.surface_form;
  }

  // Look up from our comprehensive kanji readings dictionary (100k+ entries)
  const surface = token.surface_form;
  if (readingsDict[surface]) {
    return readingsDict[surface];
  }

  // Last resort: return the surface form (will show kanji if no reading available)
  console.warn(
    `No reading found for kanji token: "${token.surface_form}" (pos: ${token.pos}, reading: "${token.reading}", pronunciation: "${token.pronunciation}")`
  );
  return token.surface_form;
}

/**
 * Fallback analysis when kuromoji fails
 * Uses FALLBACK_DICT for basic pitch accent lookup
 */
function fallbackAnalysis(text: string): WordPitchInfo[] {
  const cleaned = text.trim().replace(/\s+/g, "");
  if (!cleaned) return [];

  const tokens: string[] = [];
  let current = "";

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (PARTICLES.has(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      tokens.push(char);
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);

  return tokens.map((token) => {
    const isParticle = PARTICLES.has(token);
    const reading = token;

    // Look up fallback dictionary, particles get -1
    let accentPosition = FALLBACK_DICT[token];
    if (accentPosition === undefined) {
      accentPosition = isParticle ? -1 : token.length <= 2 ? 1 : 0;
    }

    const morae = textToMorae(reading);
    let pitchHeights: Array<"high" | "low">;

    if (accentPosition === -1 || isParticle) {
      // Particles stay low
      pitchHeights = morae.map(() => "low" as const);
    } else {
      pitchHeights = generatePitchHeights(morae.length, accentPosition);
    }

    const pattern = getPitchPattern(
      accentPosition === -1 ? 0 : accentPosition,
      morae.length
    );

    return {
      word: token,
      reading,
      morae: morae.map((mora, idx) => ({
        mora,
        pitch: pitchHeights[idx],
        isParticle,
        isDownstep:
          accentPosition > 0 &&
          idx === accentPosition - 1 &&
          idx < morae.length - 1,
      })),
      pattern,
      accentPosition: accentPosition === -1 ? 0 : accentPosition,
    };
  });
}

/**
 * Flatten word pitch data into a continuous array of mora info
 */
export function flattenMoraData(words: WordPitchInfo[]): MoraInfo[] {
  return words.flatMap((word) => word.morae);
}
