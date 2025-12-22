/**
 * Pitch Accent API Service
 * Calls the Django backend for Japanese morphological analysis using Fugashi
 */

import { MoraInfo, PitchPattern, WordPitchInfo } from "../utils/pitchAccent";

// Use the same base URL pattern as api.ts (includes /api suffix)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface ApiMoraInfo {
  mora: string;
  pitch: "H" | "L";
  isAccented: boolean;
}

interface ApiWordPitchInfo {
  word: string;
  reading: string;
  pitchNumber: number | null;
  pattern: string;
  morae: ApiMoraInfo[];
}

interface PitchAccentApiResponse {
  text: string;
  words: ApiWordPitchInfo[];
}

/**
 * Convert API response format to frontend format
 */
function convertApiResponse(apiWords: ApiWordPitchInfo[]): WordPitchInfo[] {
  return apiWords.map((word) => {
    const moraInfos: MoraInfo[] = word.morae.map((mora, idx) => ({
      mora: mora.mora,
      pitch: mora.pitch === "H" ? "high" : "low",
      isParticle: false, // Backend handles this internally
      isDownstep: mora.isAccented,
    }));

    return {
      word: word.word,
      reading: word.reading,
      morae: moraInfos,
      pattern: word.pattern as PitchPattern,
      accentPosition: word.pitchNumber ?? 0,
    };
  });
}

/**
 * Analyze pitch accent using the backend API
 */
export async function analyzePitchAccentApi(
  text: string
): Promise<WordPitchInfo[]> {
  if (!text.trim()) return [];

  try {
    const response = await fetch(
      `${API_BASE_URL}/ai/features/analyze_pitch_accent/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: PitchAccentApiResponse = await response.json();
    return convertApiResponse(data.words);
  } catch (error) {
    console.error("Pitch accent API error:", error);
    throw error;
  }
}

/**
 * Debounced pitch accent analysis for real-time typing
 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastRequestId = 0;

export function analyzePitchAccentDebounced(
  text: string,
  delay: number = 300
): Promise<WordPitchInfo[]> {
  return new Promise((resolve, reject) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const requestId = ++lastRequestId;

    debounceTimer = setTimeout(async () => {
      try {
        const result = await analyzePitchAccentApi(text);
        // Only resolve if this is still the latest request
        if (requestId === lastRequestId) {
          resolve(result);
        }
      } catch (error) {
        if (requestId === lastRequestId) {
          reject(error);
        }
      }
    }, delay);
  });
}
