// Game utilities for Kana Practice
import { KanaCharacter, getKanaByVariants } from "../data/kanaData";

// Variant selection (GoKana-style: can select multiple)
export interface VariantSelection {
  monographs: boolean;
  diacritics: boolean;
  digraphs: boolean;
}

// Game Settings Interface (GoKana-style)
export interface GameSettings {
  mode: "hiragana" | "katakana" | "both"; // "both" = hiragana + katakana combined
  variants: VariantSelection; // Multiple variants can be selected
  timerEnabled: boolean;
  audioEnabled: boolean;
  sessionLength: number; // Number of characters per session (0 = unlimited)
  showHints: boolean;
}

// Game State Interface
export interface GameState {
  currentKana: KanaCharacter | null;
  kanaPool: KanaCharacter[];
  usedKana: KanaCharacter[];
  userInput: string;
  score: number;
  streak: number;
  bestStreak: number;
  totalAttempts: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeElapsed: number; // in seconds
  isPlaying: boolean;
  isPaused: boolean;
  showHint: boolean;
  feedback: "correct" | "wrong" | null;
  settings: GameSettings;
  mistakes: MistakeRecord[];
  sessionComplete: boolean;
}

// Mistake tracking
export interface MistakeRecord {
  kana: KanaCharacter;
  userAnswer: string;
  correctAnswer: string;
  timestamp: number;
}

// Game Statistics (for localStorage)
export interface GameStats {
  totalSessions: number;
  totalCharactersPracticed: number;
  totalCorrect: number;
  totalWrong: number;
  bestStreak: number;
  averageAccuracy: number;
  totalTimePlayed: number; // in seconds
  characterStats: Record<string, CharacterStat>;
  lastPlayed: number; // timestamp
}

export interface CharacterStat {
  character: string;
  correct: number;
  wrong: number;
  lastSeen: number;
}

// Default settings (GoKana-style)
export const DEFAULT_SETTINGS: GameSettings = {
  mode: "hiragana",
  variants: {
    monographs: true,
    diacritics: false,
    digraphs: false,
  },
  timerEnabled: true,
  audioEnabled: true,
  sessionLength: 0, // Unlimited for GoKana-style (all characters in variant)
  showHints: false,
};

// Get variant key for leaderboard (sorted for consistency)
export function getVariantKey(variants: VariantSelection): string {
  const parts: string[] = [];
  if (variants.monographs) parts.push("monographs");
  if (variants.diacritics) parts.push("diacritics");
  if (variants.digraphs) parts.push("digraphs");
  return parts.join("+") || "monographs"; // Default to monographs if nothing selected
}

// Parse variant key back to selection
export function parseVariantKey(key: string): VariantSelection {
  const parts = key.split("+");
  return {
    monographs: parts.includes("monographs"),
    diacritics: parts.includes("diacritics"),
    digraphs: parts.includes("digraphs"),
  };
}

// Default game state
export function createInitialGameState(
  settings: GameSettings = DEFAULT_SETTINGS
): GameState {
  return {
    currentKana: null,
    kanaPool: [],
    usedKana: [],
    userInput: "",
    score: 0,
    streak: 0,
    bestStreak: 0,
    totalAttempts: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    timeElapsed: 0,
    isPlaying: false,
    isPaused: false,
    showHint: false,
    feedback: null,
    settings,
    mistakes: [],
    sessionComplete: false,
  };
}

// Validate user answer
export function validateAnswer(
  input: string,
  correctAnswers: string[]
): boolean {
  const normalizedInput = input.toLowerCase().trim();
  return correctAnswers.some(
    (answer) => answer.toLowerCase() === normalizedInput
  );
}

// Get random kana from pool
export function getRandomKana(pool: KanaCharacter[]): KanaCharacter | null {
  if (pool.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

// Shuffle array (Fisher-Yates algorithm)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Filter kana by settings (uses variant selection for GoKana-style filtering)
export function filterKanaBySettings(settings: GameSettings): KanaCharacter[] {
  return getKanaByVariants(settings.mode, settings.variants);
}

// Calculate score
export function calculateScore(
  isCorrect: boolean,
  currentStreak: number
): number {
  if (isCorrect) {
    // Base 10 points + streak bonus
    const streakBonus = Math.min(currentStreak * 2, 20); // Max 20 bonus points
    return 10 + streakBonus;
  }
  return -5; // Penalty for wrong answer
}

// Calculate accuracy percentage
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// Format time (seconds to MM:SS)
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

// Get progress percentage
export function getProgressPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Local Storage keys
const STATS_KEY = "kana_practice_stats";
const SETTINGS_KEY = "kana_practice_settings";

// Get user-specific stats key
function getUserStatsKey(): string {
  try {
    const authStore = localStorage.getItem("auth-storage");
    if (authStore) {
      const parsed = JSON.parse(authStore);
      const userId = parsed?.state?.user?.id;
      if (userId) {
        return `${STATS_KEY}_user_${userId}`;
      }
    }
  } catch (e) {
    console.error("Failed to get user ID for stats:", e);
  }
  return STATS_KEY; // Fallback to global stats if not logged in
}

// Load stats from localStorage (user-specific)
export function loadStats(): GameStats {
  try {
    const key = getUserStatsKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load stats:", e);
  }
  return createDefaultStats();
}

// Save stats to localStorage (user-specific)
export function saveStats(stats: GameStats): void {
  try {
    const key = getUserStatsKey();
    localStorage.setItem(key, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save stats:", e);
  }
}

// Create default stats
function createDefaultStats(): GameStats {
  return {
    totalSessions: 0,
    totalCharactersPracticed: 0,
    totalCorrect: 0,
    totalWrong: 0,
    bestStreak: 0,
    averageAccuracy: 0,
    totalTimePlayed: 0,
    characterStats: {},
    lastPlayed: Date.now(),
  };
}

// Update stats after session
export function updateStatsAfterSession(
  currentStats: GameStats,
  gameState: GameState
): GameStats {
  const newStats = { ...currentStats };

  newStats.totalSessions += 1;
  newStats.totalCharactersPracticed += gameState.totalAttempts;
  newStats.totalCorrect += gameState.correctAnswers;
  newStats.totalWrong += gameState.wrongAnswers;
  newStats.totalTimePlayed += gameState.timeElapsed;
  newStats.lastPlayed = Date.now();

  if (gameState.bestStreak > newStats.bestStreak) {
    newStats.bestStreak = gameState.bestStreak;
  }

  // Update average accuracy
  const totalAttempts = newStats.totalCorrect + newStats.totalWrong;
  newStats.averageAccuracy = calculateAccuracy(
    newStats.totalCorrect,
    totalAttempts
  );

  // Update character-specific stats
  gameState.usedKana.forEach((kana) => {
    if (!newStats.characterStats[kana.character]) {
      newStats.characterStats[kana.character] = {
        character: kana.character,
        correct: 0,
        wrong: 0,
        lastSeen: Date.now(),
      };
    }
    newStats.characterStats[kana.character].lastSeen = Date.now();
  });

  gameState.mistakes.forEach((mistake) => {
    if (newStats.characterStats[mistake.kana.character]) {
      newStats.characterStats[mistake.kana.character].wrong += 1;
    }
  });

  return newStats;
}

// Load settings from localStorage
export function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

// Speak kana using Web Speech API
export function speakKana(text: string): void {
  if (!("speechSynthesis" in window)) return;

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.8;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Try to find a Japanese voice
  const voices = speechSynthesis.getVoices();
  const japaneseVoice = voices.find(
    (voice) => voice.lang.includes("ja") || voice.lang.includes("JP")
  );
  if (japaneseVoice) {
    utterance.voice = japaneseVoice;
  }

  speechSynthesis.speak(utterance);
}

// Get hint options for a kana
export function getHintOptions(
  kana: KanaCharacter,
  allKana: KanaCharacter[]
): string[] {
  const correctAnswer = kana.romaji[0];

  // Get some random wrong answers
  const wrongOptions = allKana
    .filter((k) => k.character !== kana.character)
    .map((k) => k.romaji[0])
    .filter((r, i, arr) => arr.indexOf(r) === i) // unique
    .slice(0, 3);

  // Shuffle and include correct answer
  const options = shuffleArray([correctAnswer, ...wrongOptions.slice(0, 3)]);

  return options;
}

// Get difficulty label
export function getDifficultyLabel(
  difficulty: "beginner" | "intermediate" | "advanced"
): string {
  switch (difficulty) {
    case "beginner":
      return "Beginner (46 basic)";
    case "intermediate":
      return "Intermediate (+diacritics)";
    case "advanced":
      return "Advanced (+combinations)";
    default:
      return "Unknown";
  }
}

// Get variant label (GoKana-style)
export function getVariantLabel(
  variant: "monographs" | "diacritics" | "digraphs"
): string {
  switch (variant) {
    case "monographs":
      return "Basic kana characters (46 characters)";
    case "diacritics":
      return "Characters with dakuten/handakuten (が、ぱ, etc.)";
    case "digraphs":
      return "Combination characters (きゃ、しゅ, etc.)";
    default:
      return "Unknown";
  }
}

// Get mode label
export function getModeLabel(mode: "hiragana" | "katakana" | "mixed"): string {
  switch (mode) {
    case "hiragana":
      return "Hiragana (ひらがな)";
    case "katakana":
      return "Katakana (カタカナ)";
    case "mixed":
      return "Mixed (両方)";
  }
}
