// Translation Service using Django backend proxy to Hugging Face NLLB-200 model
// Avoids CORS issues by routing through our backend

import api from "./api";

export type SupportedLanguage = "japanese" | "english";

interface BackendTranslationResponse {
  translated_text: string;
  alternatives: string[];
  source_language: string;
  target_language: string;
}

interface BackendTranslationError {
  error: string;
}

export interface TranslationResult {
  translatedText: string;
  alternatives: string[];
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  confidence?: number;
}

/**
 * Detect if text is primarily Japanese or English
 */
export function detectLanguage(text: string): SupportedLanguage {
  // Japanese character ranges:
  // Hiragana: \u3040-\u309F
  // Katakana: \u30A0-\u30FF
  // Kanji: \u4E00-\u9FAF
  // Full-width characters: \uFF00-\uFFEF
  const japaneseRegex =
    /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF00-\uFFEF]/g;

  const japaneseMatches = text.match(japaneseRegex);
  const japaneseCharCount = japaneseMatches ? japaneseMatches.length : 0;

  // If any Japanese characters are found, consider it Japanese
  if (japaneseCharCount > 0) {
    return "japanese";
  }

  return "english";
}

/**
 * Translate text using backend proxy to Hugging Face NLLB model
 */
export async function translate(
  text: string,
  sourceLang: SupportedLanguage,
  targetLang: SupportedLanguage
): Promise<TranslationResult> {
  if (!text.trim()) {
    return {
      translatedText: "",
      alternatives: [],
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
    };
  }

  try {
    const response = await api.post<BackendTranslationResponse>(
      "/ai/features/translate/",
      {
        text,
        source_lang: sourceLang,
        target_lang: targetLang,
      }
    );

    return {
      translatedText: response.data.translated_text,
      alternatives: response.data.alternatives || [],
      sourceLanguage: response.data.source_language as SupportedLanguage,
      targetLanguage: response.data.target_language as SupportedLanguage,
    };
  } catch (error: unknown) {
    // Handle axios error
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: { data?: BackendTranslationError; status?: number };
      };

      if (axiosError.response?.data?.error) {
        throw new Error(axiosError.response.data.error);
      }

      if (axiosError.response?.status === 503) {
        throw new Error("Model is loading. Please try again in a few seconds.");
      }

      if (axiosError.response?.status === 504) {
        throw new Error("Translation request timed out. Please try again.");
      }
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Translation failed. Please try again.");
  }
}

/**
 * Auto-translate with language detection
 */
export async function autoTranslate(text: string): Promise<TranslationResult> {
  const detectedLang = detectLanguage(text);
  const targetLang: SupportedLanguage =
    detectedLang === "japanese" ? "english" : "japanese";

  return translate(text, detectedLang, targetLang);
}

export const translationService = {
  translate,
  autoTranslate,
  detectLanguage,
};

export default translationService;
