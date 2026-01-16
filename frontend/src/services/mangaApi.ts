/**
 * Manga OCR API Service
 * Handles manga image processing with Mokuro backend integration
 */

import api from "./api";

// ==================== Types ====================

export interface TextBox {
  id: string;
  text: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  width: number; // Percentage width
  height: number; // Percentage height
  confidence: number;
  vertical: boolean;
  lines?: string[]; // Individual lines for proper multi-column display
  font_size?: number; // Detected font size in pixels (12-32)
}

export interface MoraInfo {
  mora: string;
  pitch: "H" | "L";
  is_accented: boolean;
}

export interface PitchAccentWord {
  word: string;
  reading: string;
  pitch_number: number | null;
  pattern: string;
  morae: MoraInfo[];
}

export interface TokenInfo {
  surface: string;
  reading: string;
}

export interface EnrichedTextBox extends TextBox {
  tokens?: TokenInfo[];
  pitch_accent?: PitchAccentWord[];
  translation?: string;
}

export interface MangaPageResult {
  page_id: string;
  text_boxes: EnrichedTextBox[];
  raw_text: string;
  img_width?: number; // Original image width in pixels
  img_height?: number; // Original image height in pixels
}

export interface MangaServiceStatus {
  mokuro_available: boolean;
  manga_ocr_available: boolean;
  service_ready: boolean;
}

// ==================== API Functions ====================

/**
 * Convert file to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Check if Mokuro/MangaOCR services are available
 */
export async function checkMangaServiceStatus(): Promise<MangaServiceStatus> {
  const response = await api.get<MangaServiceStatus>("/ai/manga/status/");
  return response.data;
}

/**
 * Process a manga image and extract text boxes
 * Returns basic text extraction without enrichment
 */
export async function processMangaImage(file: File): Promise<MangaPageResult> {
  const base64 = await fileToBase64(file);

  const response = await api.post<MangaPageResult>("/ai/manga/process/", {
    image: base64,
    filename: file.name,
  });

  return response.data;
}

/**
 * Process a manga image with full enrichment
 * Returns text boxes with pitch accent, tokens, and optional translation
 */
export async function processMangaImageEnriched(
  file: File,
  includeTranslation: boolean = false
): Promise<MangaPageResult> {
  const base64 = await fileToBase64(file);

  const response = await api.post<MangaPageResult>(
    "/ai/manga/process_enriched/",
    {
      image: base64,
      filename: file.name,
      include_translation: includeTranslation,
    }
  );

  return response.data;
}

/**
 * Process base64 image directly (for canvas/screenshots)
 */
export async function processMangaBase64(
  base64Data: string,
  filename: string = "manga.jpg",
  enriched: boolean = true,
  includeTranslation: boolean = false
): Promise<MangaPageResult> {
  const endpoint = enriched
    ? "/ai/manga/process_enriched/"
    : "/ai/manga/process/";

  const response = await api.post<MangaPageResult>(endpoint, {
    image: base64Data,
    filename,
    include_translation: includeTranslation,
  });

  return response.data;
}
