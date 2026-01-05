import {
  CheckCircle2,
  Clock,
  Flame,
  Gamepad2,
  Home,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Settings,
  SkipForward,
  Target,
  Trophy,
  Volume2,
  VolumeX,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { Link } from "react-router-dom";
import { KanaCharacter } from "../data/kanaData";
import { useThemeStore } from "../store/themeStore";
import {
  GameSettings,
  GameState,
  MistakeRecord,
  calculateAccuracy,
  calculateScore,
  createInitialGameState,
  filterKanaBySettings,
  formatTime,
  getDifficultyLabel,
  getHintOptions,
  getProgressPercentage,
  getRandomKana,
  loadSettings,
  loadStats,
  saveSettings,
  saveStats,
  shuffleArray,
  speakKana,
  updateStatsAfterSession,
  validateAnswer,
} from "../utils/gameUtils";

// Action types for reducer
type GameAction =
  | { type: "START_GAME" }
  | { type: "PAUSE_GAME" }
  | { type: "RESUME_GAME" }
  | { type: "END_GAME" }
  | { type: "SET_INPUT"; payload: string }
  | { type: "SUBMIT_ANSWER" }
  | { type: "NEXT_KANA" }
  | { type: "SHOW_HINT" }
  | { type: "SKIP" }
  | { type: "TICK" }
  | { type: "UPDATE_SETTINGS"; payload: Partial<GameSettings> }
  | { type: "RESET_GAME" }
  | { type: "CLEAR_FEEDBACK" }
  | { type: "INIT_POOL"; payload: KanaCharacter[] };

// Reducer for game state management
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "INIT_POOL": {
      const pool = shuffleArray(action.payload);
      const sessionPool =
        state.settings.sessionLength > 0
          ? pool.slice(0, state.settings.sessionLength)
          : pool;
      return {
        ...state,
        kanaPool: sessionPool,
      };
    }

    case "START_GAME": {
      const pool = shuffleArray(filterKanaBySettings(state.settings));
      const sessionPool =
        state.settings.sessionLength > 0
          ? pool.slice(0, state.settings.sessionLength)
          : pool;
      const firstKana = getRandomKana(sessionPool);
      return {
        ...state,
        isPlaying: true,
        isPaused: false,
        kanaPool: sessionPool.filter((k) => k !== firstKana),
        currentKana: firstKana,
        usedKana: firstKana ? [firstKana] : [],
        score: 0,
        streak: 0,
        bestStreak: 0,
        totalAttempts: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        timeElapsed: 0,
        userInput: "",
        showHint: false,
        feedback: null,
        mistakes: [],
        sessionComplete: false,
      };
    }

    case "PAUSE_GAME":
      return { ...state, isPaused: true };

    case "RESUME_GAME":
      return { ...state, isPaused: false };

    case "END_GAME":
      return { ...state, isPlaying: false, sessionComplete: true };

    case "SET_INPUT":
      return { ...state, userInput: action.payload };

    case "SUBMIT_ANSWER": {
      if (!state.currentKana || state.feedback) return state;

      const isCorrect = validateAnswer(
        state.userInput,
        state.currentKana.romaji
      );
      const scoreChange = calculateScore(isCorrect, state.streak);
      const newStreak = isCorrect ? state.streak + 1 : 0;
      const newBestStreak = Math.max(state.bestStreak, newStreak);

      const mistake: MistakeRecord | null = isCorrect
        ? null
        : {
            kana: state.currentKana,
            userAnswer: state.userInput,
            correctAnswer: state.currentKana.romaji[0],
            timestamp: Date.now(),
          };

      return {
        ...state,
        score: Math.max(0, state.score + scoreChange),
        streak: newStreak,
        bestStreak: newBestStreak,
        totalAttempts: state.totalAttempts + 1,
        correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
        wrongAnswers: state.wrongAnswers + (isCorrect ? 0 : 1),
        feedback: isCorrect ? "correct" : "wrong",
        mistakes: mistake ? [...state.mistakes, mistake] : state.mistakes,
      };
    }

    case "NEXT_KANA": {
      // Check if session is complete
      if (
        state.kanaPool.length === 0 ||
        (state.settings.sessionLength > 0 &&
          state.totalAttempts >= state.settings.sessionLength)
      ) {
        return { ...state, isPlaying: false, sessionComplete: true };
      }

      const nextKana = getRandomKana(state.kanaPool);
      return {
        ...state,
        currentKana: nextKana,
        kanaPool: state.kanaPool.filter((k) => k !== nextKana),
        usedKana: nextKana ? [...state.usedKana, nextKana] : state.usedKana,
        userInput: "",
        showHint: false,
        feedback: null,
      };
    }

    case "SHOW_HINT":
      return { ...state, showHint: true };

    case "SKIP": {
      if (state.kanaPool.length === 0) {
        return { ...state, isPlaying: false, sessionComplete: true };
      }
      const nextKana = getRandomKana(state.kanaPool);
      return {
        ...state,
        currentKana: nextKana,
        kanaPool: state.kanaPool.filter((k) => k !== nextKana),
        usedKana: nextKana ? [...state.usedKana, nextKana] : state.usedKana,
        userInput: "",
        showHint: false,
        feedback: null,
        streak: 0, // Reset streak on skip
      };
    }

    case "TICK":
      return { ...state, timeElapsed: state.timeElapsed + 1 };

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case "RESET_GAME":
      return createInitialGameState(state.settings);

    case "CLEAR_FEEDBACK":
      return { ...state, feedback: null };

    default:
      return state;
  }
}

export default function KanaPracticePage() {
  const isDark = useThemeStore((state) => state.isDark);
  const [state, dispatch] = useReducer(
    gameReducer,
    loadSettings(),
    createInitialGameState
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings on mount
  useEffect(() => {
    const savedSettings = loadSettings();
    dispatch({ type: "UPDATE_SETTINGS", payload: savedSettings });
  }, []);

  // Timer effect
  useEffect(() => {
    if (state.isPlaying && !state.isPaused && state.settings.timerEnabled) {
      timerRef.current = setInterval(() => {
        dispatch({ type: "TICK" });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isPlaying, state.isPaused, state.settings.timerEnabled]);

  // Focus input when game starts or new kana
  useEffect(() => {
    if (state.isPlaying && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isPlaying, state.currentKana]);

  // Auto-advance after feedback
  useEffect(() => {
    if (state.feedback) {
      const timer = setTimeout(
        () => {
          dispatch({ type: "NEXT_KANA" });
        },
        state.feedback === "correct" ? 500 : 1500
      );
      return () => clearTimeout(timer);
    }
  }, [state.feedback]);

  // Save stats when session ends
  useEffect(() => {
    if (state.sessionComplete && state.totalAttempts > 0) {
      const currentStats = loadStats();
      const updatedStats = updateStatsAfterSession(currentStats, state);
      saveStats(updatedStats);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionComplete, state.totalAttempts]);

  // Handlers
  const handleStartGame = useCallback(() => {
    dispatch({ type: "START_GAME" });
  }, []);

  const handlePauseGame = useCallback(() => {
    dispatch({ type: "PAUSE_GAME" });
  }, []);

  const handleResumeGame = useCallback(() => {
    dispatch({ type: "RESUME_GAME" });
  }, []);

  // Check if input could still become a valid answer (is prefix of any valid romaji)
  const couldBeCorrect = useCallback(
    (input: string, validAnswers: string[]): boolean => {
      const normalizedInput = input.toLowerCase().trim();
      if (!normalizedInput) return true;
      return validAnswers.some((answer) =>
        answer.toLowerCase().startsWith(normalizedInput)
      );
    },
    []
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      dispatch({ type: "SET_INPUT", payload: newValue });

      // Auto-submit if answer is correct or definitively wrong
      if (state.currentKana && !state.feedback && newValue.trim()) {
        const isCorrect = validateAnswer(newValue, state.currentKana.romaji);
        if (isCorrect) {
          // Correct answer - submit with small delay
          setTimeout(() => {
            dispatch({ type: "SUBMIT_ANSWER" });
            if (state.settings.audioEnabled && state.currentKana) {
              speakKana(state.currentKana.character);
            }
          }, 100);
        } else if (!couldBeCorrect(newValue, state.currentKana.romaji)) {
          // Input can't possibly become correct - submit as wrong
          setTimeout(() => {
            dispatch({ type: "SUBMIT_ANSWER" });
          }, 100);
        }
      }
    },
    [
      state.currentKana,
      state.feedback,
      state.settings.audioEnabled,
      couldBeCorrect,
    ]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (state.userInput.trim() && !state.feedback) {
        dispatch({ type: "SUBMIT_ANSWER" });
        // Play audio on correct answer
        if (
          state.settings.audioEnabled &&
          state.currentKana &&
          validateAnswer(state.userInput, state.currentKana.romaji)
        ) {
          speakKana(state.currentKana.character);
        }
      }
    },
    [
      state.userInput,
      state.feedback,
      state.settings.audioEnabled,
      state.currentKana,
    ]
  );

  const handleSkip = useCallback(() => {
    dispatch({ type: "SKIP" });
  }, []);

  const handleShowHint = useCallback(() => {
    dispatch({ type: "SHOW_HINT" });
  }, []);

  const handlePlayAudio = useCallback(() => {
    if (state.currentKana) {
      speakKana(state.currentKana.character);
    }
  }, [state.currentKana]);

  const handleResetGame = useCallback(() => {
    dispatch({ type: "RESET_GAME" });
  }, []);

  const handleSettingsChange = useCallback(
    (newSettings: Partial<GameSettings>) => {
      dispatch({ type: "UPDATE_SETTINGS", payload: newSettings });
      saveSettings({ ...state.settings, ...newSettings });
    },
    [state.settings]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.isPlaying) return;

      if (e.key === "Escape") {
        if (state.isPaused) {
          handleResumeGame();
        } else {
          handlePauseGame();
        }
      } else if (e.key === "Tab" && state.settings.showHints) {
        e.preventDefault();
        handleShowHint();
      } else if (e.key === " " && e.shiftKey) {
        e.preventDefault();
        handlePlayAudio();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    state.isPlaying,
    state.isPaused,
    state.settings.showHints,
    handleResumeGame,
    handlePauseGame,
    handleShowHint,
    handlePlayAudio,
  ]);

  // Calculate progress - based on characters seen vs total session
  const totalSession =
    state.settings.sessionLength ||
    state.usedKana.length + state.kanaPool.length ||
    1;
  const completedCount =
    state.usedKana.length > 0
      ? state.usedKana.length - 1 + (state.feedback ? 1 : 0)
      : 0;
  const progress = getProgressPercentage(completedCount, totalSession);

  // Get hint options
  const hintOptions = state.currentKana
    ? getHintOptions(state.currentKana, filterKanaBySettings(state.settings))
    : [];

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-b from-pink-50 via-white to-gray-50"
      }`}
    >
      {/* Header */}
      <div
        className={`${
          isDark ? "bg-gray-800/50" : "bg-white/80"
        } backdrop-blur-sm border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary-500" />
            <h1
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Kana Practice
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`p-2 rounded-lg ${
                isDark
                  ? "hover:bg-gray-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <Home className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Not Playing - Start Screen */}
        {!state.isPlaying && !state.sessionComplete && (
          <StartScreen
            isDark={isDark}
            settings={state.settings}
            onSettingsChange={handleSettingsChange}
            onStart={handleStartGame}
          />
        )}

        {/* Playing - Game Screen */}
        {state.isPlaying && !state.sessionComplete && (
          <>
            {/* Pause Overlay */}
            {state.isPaused && (
              <PauseOverlay
                isDark={isDark}
                onResume={handleResumeGame}
                onQuit={handleResetGame}
              />
            )}

            {/* Score Display */}
            <ScoreDisplay
              isDark={isDark}
              score={state.score}
              streak={state.streak}
              timeElapsed={state.timeElapsed}
              progress={progress}
              accuracy={calculateAccuracy(
                state.correctAnswers,
                state.totalAttempts
              )}
              onPause={handlePauseGame}
            />

            {/* Kana Card */}
            <KanaCard
              isDark={isDark}
              kana={state.currentKana}
              feedback={state.feedback}
            />

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mt-8">
              <div className="flex justify-center">
                <div className="relative w-full max-w-sm">
                  <input
                    ref={inputRef}
                    type="text"
                    value={state.userInput}
                    onChange={handleInputChange}
                    placeholder="Type romaji..."
                    disabled={!!state.feedback}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className={`w-full px-6 py-4 text-2xl text-center rounded-2xl border-2 transition-all focus:outline-none focus:ring-4 ${
                      state.feedback === "correct"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                        : state.feedback === "wrong"
                        ? "border-red-500 bg-red-50 dark:bg-red-900/30"
                        : isDark
                        ? "bg-gray-800 border-gray-600 text-white focus:border-primary-500 focus:ring-primary-500/20"
                        : "bg-white border-gray-300 text-gray-900 focus:border-primary-500 focus:ring-primary-500/20"
                    }`}
                  />
                  {state.feedback === "wrong" && state.currentKana && (
                    <div className="absolute -bottom-8 left-0 right-0 text-center">
                      <span className="text-red-500 font-medium">
                        Correct: {state.currentKana.romaji.join(" / ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </form>

            {/* Hint Options */}
            {state.showHint && state.settings.showHints && (
              <div className="mt-12 flex justify-center gap-3 flex-wrap">
                {hintOptions.map((hint, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      dispatch({ type: "SET_INPUT", payload: hint })
                    }
                    className={`px-6 py-3 rounded-xl text-lg font-medium transition-all ${
                      isDark
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    }`}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-12 flex justify-center gap-4">
              <button
                onClick={handleSkip}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>

              {state.settings.showHints && (
                <button
                  onClick={handleShowHint}
                  disabled={state.showHint}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    state.showHint
                      ? "opacity-50 cursor-not-allowed"
                      : isDark
                      ? "bg-yellow-600 hover:bg-yellow-500 text-white"
                      : "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  Hint
                </button>
              )}

              {state.settings.audioEnabled && (
                <button
                  onClick={handlePlayAudio}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    isDark
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  Listen
                </button>
              )}
            </div>

            {/* Keyboard Shortcuts Info */}
            <div
              className={`mt-8 text-center text-sm ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              <span className="inline-flex items-center gap-4">
                <span>
                  <kbd className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs">
                    Enter
                  </kbd>{" "}
                  Submit
                </span>
                <span>
                  <kbd className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs">
                    Tab
                  </kbd>{" "}
                  Hint
                </span>
                <span>
                  <kbd className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs">
                    Esc
                  </kbd>{" "}
                  Pause
                </span>
              </span>
            </div>
          </>
        )}

        {/* Session Complete - Results Screen */}
        {state.sessionComplete && (
          <ResultsScreen
            isDark={isDark}
            score={state.score}
            correctAnswers={state.correctAnswers}
            wrongAnswers={state.wrongAnswers}
            bestStreak={state.bestStreak}
            timeElapsed={state.timeElapsed}
            accuracy={calculateAccuracy(
              state.correctAnswers,
              state.totalAttempts
            )}
            mistakes={state.mistakes}
            onPlayAgain={handleStartGame}
            onHome={handleResetGame}
          />
        )}
      </div>
    </div>
  );
}

// Sub-components

interface StartScreenProps {
  isDark: boolean;
  settings: GameSettings;
  onSettingsChange: (settings: Partial<GameSettings>) => void;
  onStart: () => void;
}

function StartScreen({
  isDark,
  settings,
  onSettingsChange,
  onStart,
}: StartScreenProps) {
  const stats = loadStats();

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div
        className={`rounded-3xl p-8 text-center ${
          isDark ? "bg-gray-800/50" : "bg-white shadow-lg"
        }`}
      >
        <div className="text-6xl mb-4">🎮</div>
        <h2
          className={`text-3xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Kana Practice Game
        </h2>
        <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Master Japanese hiragana and katakana through fun practice!
        </p>
      </div>

      {/* Settings Card */}
      <div
        className={`rounded-3xl p-6 ${
          isDark ? "bg-gray-800/50" : "bg-white shadow-lg"
        }`}
      >
        <h3
          className={`text-xl font-semibold mb-6 flex items-center gap-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          <Settings className="w-5 h-5" />
          Game Settings
        </h3>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Writing System
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["hiragana", "katakana", "mixed"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onSettingsChange({ mode })}
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${
                    settings.mode === mode
                      ? "bg-primary-500 text-white"
                      : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {mode === "hiragana"
                    ? "ひらがな"
                    : mode === "katakana"
                    ? "カタカナ"
                    : "Mixed"}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["beginner", "intermediate", "advanced"] as const).map(
                (diff) => (
                  <button
                    key={diff}
                    onClick={() => onSettingsChange({ difficulty: diff })}
                    className={`py-3 px-4 rounded-xl font-medium transition-all ${
                      settings.difficulty === diff
                        ? "bg-primary-500 text-white"
                        : isDark
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </button>
                )
              )}
            </div>
            <p
              className={`mt-2 text-sm ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {getDifficultyLabel(settings.difficulty)}
            </p>
          </div>

          {/* Session Length */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Session Length
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 50, 0].map((len) => (
                <button
                  key={len}
                  onClick={() => onSettingsChange({ sessionLength: len })}
                  className={`py-3 px-4 rounded-xl font-medium transition-all ${
                    settings.sessionLength === len
                      ? "bg-primary-500 text-white"
                      : isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {len === 0 ? "∞" : len}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Options */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() =>
                onSettingsChange({ timerEnabled: !settings.timerEnabled })
              }
              className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all ${
                settings.timerEnabled
                  ? "bg-green-500/20 text-green-500 border border-green-500"
                  : isDark
                  ? "bg-gray-700 text-gray-400"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <Clock className="w-4 h-4" />
              Timer
            </button>

            <button
              onClick={() =>
                onSettingsChange({ audioEnabled: !settings.audioEnabled })
              }
              className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all ${
                settings.audioEnabled
                  ? "bg-green-500/20 text-green-500 border border-green-500"
                  : isDark
                  ? "bg-gray-700 text-gray-400"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {settings.audioEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              Audio
            </button>

            <button
              onClick={() =>
                onSettingsChange({ showHints: !settings.showHints })
              }
              className={`flex items-center gap-2 py-2 px-4 rounded-xl transition-all ${
                settings.showHints
                  ? "bg-green-500/20 text-green-500 border border-green-500"
                  : isDark
                  ? "bg-gray-700 text-gray-400"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              Hints
            </button>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      {stats.totalSessions > 0 && (
        <div
          className={`rounded-3xl p-6 ${
            isDark ? "bg-gray-800/50" : "bg-white shadow-lg"
          }`}
        >
          <h3
            className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">
                {stats.totalSessions}
              </div>
              <div
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Sessions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.averageAccuracy}%
              </div>
              <div
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Accuracy
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {stats.bestStreak}
              </div>
              <div
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Best Streak
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {formatTime(stats.totalTimePlayed)}
              </div>
              <div
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Total Time
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={onStart}
        className="w-full py-5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-xl font-bold rounded-2xl shadow-lg shadow-primary-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
      >
        <Play className="w-6 h-6" />
        Start Game
      </button>
    </div>
  );
}

interface ScoreDisplayProps {
  isDark: boolean;
  score: number;
  streak: number;
  timeElapsed: number;
  progress: number;
  accuracy: number;
  onPause: () => void;
}

function ScoreDisplay({
  isDark,
  score,
  streak,
  timeElapsed,
  progress,
  accuracy,
  onPause,
}: ScoreDisplayProps) {
  return (
    <div
      className={`rounded-2xl p-4 mb-8 ${
        isDark ? "bg-gray-800/50" : "bg-white shadow-lg"
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Score */}
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span
            className={`text-xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {score}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <span
            className={`font-mono text-lg ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {formatTime(timeElapsed)}
          </span>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2">
          <Flame
            className={`w-5 h-5 ${
              streak >= 5 ? "text-orange-500 animate-pulse" : "text-gray-400"
            }`}
          />
          <span
            className={`text-lg font-bold ${
              streak >= 5
                ? "text-orange-500"
                : isDark
                ? "text-gray-300"
                : "text-gray-700"
            }`}
          >
            {streak}
          </span>
        </div>

        {/* Accuracy */}
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-green-500" />
          <span
            className={`text-lg ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            {accuracy}%
          </span>
        </div>

        {/* Pause Button */}
        <button
          onClick={onPause}
          className={`p-2 rounded-lg ${
            isDark
              ? "hover:bg-gray-700 text-gray-400"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <Pause className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div
          className={`h-2 rounded-full overflow-hidden ${
            isDark ? "bg-gray-700" : "bg-gray-200"
          }`}
        >
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className={`mt-1 text-sm text-right ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {progress}% complete
        </div>
      </div>
    </div>
  );
}

interface KanaCardProps {
  isDark: boolean;
  kana: KanaCharacter | null;
  feedback: "correct" | "wrong" | null;
}

function KanaCard({ isDark, kana, feedback }: KanaCardProps) {
  if (!kana) return null;

  return (
    <div className="flex justify-center">
      <div
        className={`w-64 h-64 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 transform ${
          feedback === "correct"
            ? "bg-green-500 scale-105 shadow-2xl shadow-green-500/50"
            : feedback === "wrong"
            ? "bg-red-500 scale-95 animate-shake"
            : isDark
            ? "bg-gray-800 shadow-xl"
            : "bg-white shadow-xl"
        }`}
      >
        <span
          className={`text-8xl font-bold ${
            feedback ? "text-white" : isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {kana.character}
        </span>
        <span
          className={`mt-2 text-sm px-3 py-1 rounded-full ${
            feedback
              ? "bg-white/20 text-white"
              : isDark
              ? "bg-gray-700 text-gray-400"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {kana.type === "hiragana" ? "ひらがな" : "カタカナ"}
        </span>

        {/* Feedback Icons */}
        {feedback === "correct" && (
          <CheckCircle2 className="absolute top-4 right-4 w-8 h-8 text-white" />
        )}
        {feedback === "wrong" && (
          <XCircle className="absolute top-4 right-4 w-8 h-8 text-white" />
        )}
      </div>
    </div>
  );
}

interface PauseOverlayProps {
  isDark: boolean;
  onResume: () => void;
  onQuit: () => void;
}

function PauseOverlay({ isDark, onResume, onQuit }: PauseOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`rounded-3xl p-8 text-center max-w-sm w-full mx-4 ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <Pause className="w-16 h-16 mx-auto mb-4 text-primary-500" />
        <h2
          className={`text-2xl font-bold mb-6 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Game Paused
        </h2>
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Resume
          </button>
          <button
            onClick={onQuit}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            <X className="w-5 h-5" />
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResultsScreenProps {
  isDark: boolean;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  bestStreak: number;
  timeElapsed: number;
  accuracy: number;
  mistakes: MistakeRecord[];
  onPlayAgain: () => void;
  onHome: () => void;
}

function ResultsScreen({
  isDark,
  score,
  correctAnswers,
  wrongAnswers,
  bestStreak,
  timeElapsed,
  accuracy,
  mistakes,
  onPlayAgain,
  onHome,
}: ResultsScreenProps) {
  // Determine performance grade
  const getGrade = () => {
    if (accuracy >= 95)
      return { grade: "S", color: "text-yellow-400", emoji: "🏆" };
    if (accuracy >= 85)
      return { grade: "A", color: "text-green-500", emoji: "⭐" };
    if (accuracy >= 70)
      return { grade: "B", color: "text-blue-500", emoji: "👍" };
    if (accuracy >= 50)
      return { grade: "C", color: "text-orange-500", emoji: "📚" };
    return { grade: "D", color: "text-red-500", emoji: "💪" };
  };

  const { grade, color, emoji } = getGrade();

  return (
    <div className="space-y-6">
      {/* Results Card */}
      <div
        className={`rounded-3xl p-8 text-center ${
          isDark ? "bg-gray-800/50" : "bg-white shadow-lg"
        }`}
      >
        <div className="text-6xl mb-2">{emoji}</div>
        <h2
          className={`text-3xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Session Complete!
        </h2>
        <div className={`text-6xl font-bold ${color} mb-4`}>{grade}</div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div
            className={`p-4 rounded-2xl ${
              isDark ? "bg-gray-700/50" : "bg-gray-100"
            }`}
          >
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold text-primary-500">{score}</div>
            <div
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Score
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl ${
              isDark ? "bg-gray-700/50" : "bg-gray-100"
            }`}
          >
            <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-green-500">{accuracy}%</div>
            <div
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Accuracy
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl ${
              isDark ? "bg-gray-700/50" : "bg-gray-100"
            }`}
          >
            <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-orange-500">
              {bestStreak}
            </div>
            <div
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Best Streak
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl ${
              isDark ? "bg-gray-700/50" : "bg-gray-100"
            }`}
          >
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-blue-500">
              {formatTime(timeElapsed)}
            </div>
            <div
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Time
            </div>
          </div>
        </div>

        {/* Correct/Wrong */}
        <div className="flex justify-center gap-8 mt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className={isDark ? "text-gray-300" : "text-gray-700"}>
              {correctAnswers} correct
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className={isDark ? "text-gray-300" : "text-gray-700"}>
              {wrongAnswers} wrong
            </span>
          </div>
        </div>
      </div>

      {/* Mistakes Review */}
      {mistakes.length > 0 && (
        <div
          className={`rounded-3xl p-6 ${
            isDark ? "bg-gray-800/50" : "bg-white shadow-lg"
          }`}
        >
          <h3
            className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            <Zap className="w-5 h-5 text-red-500" />
            Review Your Mistakes
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mistakes.map((mistake, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl text-center ${
                  isDark ? "bg-red-900/30" : "bg-red-50"
                }`}
              >
                <div className="text-3xl font-bold mb-1">
                  {mistake.kana.character}
                </div>
                <div className="text-green-500 font-medium">
                  {mistake.correctAnswer}
                </div>
                <div className="text-red-400 text-sm line-through">
                  {mistake.userAnswer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
        <button
          onClick={onHome}
          className={`py-4 px-6 rounded-2xl font-semibold flex items-center gap-2 ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
        >
          <Home className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
