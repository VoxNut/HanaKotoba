import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  SupportedLanguage,
  TranslationResult,
  translationService,
} from "../services/translationService";
import { useThemeStore } from "../store/themeStore";
import { useToastStore } from "../store/toastStore";
import { ttsService, waitForVoices } from "../utils/textToSpeech";

type LanguageOption = {
  code: SupportedLanguage | "auto";
  name: string;
  nativeName: string;
};

const LANGUAGES: LanguageOption[] = [
  { code: "auto", name: "Auto-detect", nativeName: "自動検出" },
  { code: "japanese", name: "Japanese", nativeName: "日本語" },
  { code: "english", name: "English", nativeName: "English" },
];

export default function TranslationPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const addToast = useToastStore((state) => state.addToast);

  // Input state
  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState<SupportedLanguage | "auto">(
    "auto"
  );
  const [targetLang, setTargetLang] = useState<SupportedLanguage>("english");

  // Output state
  const [translationResult, setTranslationResult] =
    useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detected language state (for auto-detect)
  const [detectedLang, setDetectedLang] = useState<SupportedLanguage | null>(
    null
  );

  // TTS state
  const [isPlayingSource, setIsPlayingSource] = useState(false);
  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Dropdown state
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);

  // Copy state
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);

  // Debounce the source text for real-time translation
  const debouncedSourceText = useDebounce(sourceText, 500);

  // Load voices
  useEffect(() => {
    const loadVoices = async () => {
      const availableVoices = await waitForVoices();
      setVoices(availableVoices);
    };
    loadVoices();
  }, []);

  // Auto-translate when debounced text changes
  useEffect(() => {
    const performTranslation = async () => {
      if (!debouncedSourceText.trim()) {
        setTranslationResult(null);
        setDetectedLang(null);
        setError(null);
        return;
      }

      setIsTranslating(true);
      setError(null);

      try {
        let result: TranslationResult;

        if (sourceLang === "auto") {
          // Use auto-detect
          result = await translationService.autoTranslate(debouncedSourceText);
          setDetectedLang(result.sourceLanguage);

          // Update target language to opposite of detected
          if (result.sourceLanguage === "japanese") {
            setTargetLang("english");
          } else {
            setTargetLang("japanese");
          }
        } else {
          result = await translationService.translate(
            debouncedSourceText,
            sourceLang,
            targetLang
          );
        }

        setTranslationResult(result);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Translation failed";
        setError(errorMessage);
        addToast(errorMessage, "error");
      } finally {
        setIsTranslating(false);
      }
    };

    performTranslation();
  }, [debouncedSourceText, sourceLang, targetLang, addToast]);

  // Handle language swap
  const handleSwapLanguages = useCallback(() => {
    if (sourceLang === "auto") {
      // If auto-detect, swap detected language with target
      if (detectedLang) {
        setSourceLang(targetLang);
        setTargetLang(detectedLang);

        // Swap texts
        if (translationResult) {
          setSourceText(translationResult.translatedText);
        }
      }
    } else {
      // Normal swap
      const tempLang = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(tempLang);

      // Swap texts
      if (translationResult) {
        setSourceText(translationResult.translatedText);
      }
    }
  }, [sourceLang, targetLang, detectedLang, translationResult]);

  // Handle clear
  const handleClear = () => {
    setSourceText("");
    setTranslationResult(null);
    setDetectedLang(null);
    setError(null);
  };

  // Handle copy
  const handleCopy = async (text: string, isSource: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isSource) {
        setCopiedSource(true);
        setTimeout(() => setCopiedSource(false), 2000);
      } else {
        setCopiedTarget(true);
        setTimeout(() => setCopiedTarget(false), 2000);
      }
      addToast("Copied to clipboard", "success");
    } catch {
      addToast("Failed to copy", "error");
    }
  };

  // Handle TTS
  const handleSpeak = (
    text: string,
    lang: SupportedLanguage,
    isSource: boolean
  ) => {
    if (!text.trim()) return;

    const setPlaying = isSource ? setIsPlayingSource : setIsPlayingTarget;
    setPlaying(true);

    // Find appropriate voice
    const langPrefix = lang === "japanese" ? "ja" : "en";
    const voice = voices.find((v) => v.lang.startsWith(langPrefix)) || null;

    ttsService.speak(text, {
      voice: voice || undefined,
      rate: 0.9,
      onEnd: () => setPlaying(false),
      onError: () => {
        setPlaying(false);
        addToast("Failed to play audio", "error");
      },
    });
  };

  const getDisplayLanguage = (code: SupportedLanguage | "auto"): string => {
    if (code === "auto") {
      return detectedLang
        ? `${LANGUAGES.find((l) => l.code === detectedLang)?.name} (detected)`
        : "Auto-detect";
    }
    return LANGUAGES.find((l) => l.code === code)?.name || code;
  };

  const getCurrentSourceLang = (): SupportedLanguage => {
    if (sourceLang === "auto") {
      return detectedLang || "japanese";
    }
    return sourceLang;
  };

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
            Japanese ↔ English Translation
          </h1>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Powered by MyMemory • Free machine translation
          </p>
        </div>

        {/* Language Selection Bar */}
        <div
          className={`flex items-center justify-center gap-4 mb-6 p-3 rounded-xl ${
            isDark ? "bg-gray-800/50" : "bg-white shadow-sm"
          }`}
        >
          {/* Source Language Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSourceDropdown(!showSourceDropdown);
                setShowTargetDropdown(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isDark
                  ? "hover:bg-gray-700 text-gray-200"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <span>{getDisplayLanguage(sourceLang)}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSourceDropdown && (
              <div
                className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg z-10 min-w-[160px] ${
                  isDark
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSourceLang(lang.code);
                      setShowSourceDropdown(false);
                      if (lang.code !== "auto" && lang.code === targetLang) {
                        setTargetLang(
                          lang.code === "japanese" ? "english" : "japanese"
                        );
                      }
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center justify-between transition-colors ${
                      sourceLang === lang.code
                        ? isDark
                          ? "bg-primary-900/30 text-primary-300"
                          : "bg-primary-50 text-primary-700"
                        : isDark
                        ? "hover:bg-gray-700 text-gray-200"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-xs opacity-60">
                      {lang.nativeName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapLanguages}
            disabled={isTranslating}
            className={`p-3 rounded-full transition-all ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-600"
            } disabled:opacity-50`}
            title="Swap languages"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>

          {/* Target Language Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTargetDropdown(!showTargetDropdown);
                setShowSourceDropdown(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isDark
                  ? "hover:bg-gray-700 text-gray-200"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <span>{getDisplayLanguage(targetLang)}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showTargetDropdown && (
              <div
                className={`absolute top-full right-0 mt-1 py-1 rounded-lg shadow-lg z-10 min-w-[160px] ${
                  isDark
                    ? "bg-gray-800 border border-gray-700"
                    : "bg-white border border-gray-200"
                }`}
              >
                {LANGUAGES.filter((l) => l.code !== "auto").map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setTargetLang(lang.code as SupportedLanguage);
                      setShowTargetDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left flex items-center justify-between transition-colors ${
                      targetLang === lang.code
                        ? isDark
                          ? "bg-primary-900/30 text-primary-300"
                          : "bg-primary-50 text-primary-700"
                        : isDark
                        ? "hover:bg-gray-700 text-gray-200"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span>{lang.name}</span>
                    <span className="text-xs opacity-60">
                      {lang.nativeName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Translation Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Panel */}
          <div
            className={`relative rounded-2xl border overflow-hidden ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Source Textarea */}
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={
                sourceLang === "japanese" ||
                (sourceLang === "auto" && !detectedLang)
                  ? "日本語のテキストを入力してください..."
                  : "Enter English text..."
              }
              className={`w-full h-64 p-4 resize-none focus:outline-none text-lg ${
                isDark
                  ? "bg-transparent text-white placeholder-gray-500"
                  : "bg-transparent text-gray-900 placeholder-gray-400"
              }`}
            />

            {/* Clear Button */}
            {sourceText && (
              <button
                onClick={handleClear}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                  isDark
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
                title="Clear"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Source Actions */}
            <div
              className={`flex items-center justify-between p-3 border-t ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {/* TTS Button */}
                <button
                  onClick={() =>
                    handleSpeak(sourceText, getCurrentSourceLang(), true)
                  }
                  disabled={!sourceText.trim() || isPlayingSource}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-gray-700 text-gray-400 disabled:text-gray-600"
                      : "hover:bg-gray-100 text-gray-500 disabled:text-gray-300"
                  }`}
                  title="Listen"
                >
                  <Volume2
                    className={`w-5 h-5 ${
                      isPlayingSource ? "animate-pulse text-primary-500" : ""
                    }`}
                  />
                </button>

                {/* History buttons placeholder (undo/redo) */}
                <div className="flex items-center gap-1">
                  <button
                    className={`p-2 rounded-lg transition-colors opacity-50 cursor-not-allowed ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    disabled
                    title="Undo"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 7v6h6M3 13a9 9 0 1 0 2.6-6.4L3 7" />
                    </svg>
                  </button>
                  <button
                    className={`p-2 rounded-lg transition-colors opacity-50 cursor-not-allowed ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    disabled
                    title="Redo"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 7v6h-6M21 13a9 9 0 1 1-2.6-6.4L21 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={() => handleCopy(sourceText, true)}
                disabled={!sourceText.trim()}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? "hover:bg-gray-700 text-gray-400 disabled:text-gray-600"
                    : "hover:bg-gray-100 text-gray-500 disabled:text-gray-300"
                }`}
                title="Copy"
              >
                {copiedSource ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Target Panel */}
          <div
            className={`relative rounded-2xl border overflow-hidden ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Translation Output */}
            <div className="h-64 p-4 overflow-y-auto">
              {isTranslating ? (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Translating...</span>
                </div>
              ) : error ? (
                <div className="text-red-400">{error}</div>
              ) : translationResult?.translatedText ? (
                <div className="space-y-4">
                  {/* Main Translation */}
                  <p
                    className={`text-lg ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {translationResult.translatedText}
                  </p>

                  {/* Alternatives */}
                  {translationResult.alternatives.length > 0 && (
                    <div
                      className={`pt-4 border-t ${
                        isDark ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium mb-2 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Alternatives:
                      </p>
                      <div className="space-y-2">
                        {translationResult.alternatives.map((alt, index) => (
                          <p
                            key={index}
                            className={`text-base ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {alt}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className={`${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Translation will appear here...
                </p>
              )}
            </div>

            {/* Target Actions */}
            <div
              className={`flex items-center justify-between p-3 border-t ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {/* TTS Button */}
                <button
                  onClick={() =>
                    translationResult &&
                    handleSpeak(
                      translationResult.translatedText,
                      targetLang,
                      false
                    )
                  }
                  disabled={
                    !translationResult?.translatedText || isPlayingTarget
                  }
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-gray-700 text-gray-400 disabled:text-gray-600"
                      : "hover:bg-gray-100 text-gray-500 disabled:text-gray-300"
                  }`}
                  title="Listen"
                >
                  <Volume2
                    className={`w-5 h-5 ${
                      isPlayingTarget ? "animate-pulse text-primary-500" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Feedback buttons (placeholder) */}
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                  title="Good translation"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                  title="Bad translation"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                  </svg>
                </button>

                {/* Copy Button */}
                <button
                  onClick={() =>
                    translationResult &&
                    handleCopy(translationResult.translatedText, false)
                  }
                  disabled={!translationResult?.translatedText}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-gray-700 text-gray-400 disabled:text-gray-600"
                      : "hover:bg-gray-100 text-gray-500 disabled:text-gray-300"
                  }`}
                  title="Copy"
                >
                  {copiedTarget ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>

                {/* Share button (placeholder) */}
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-gray-700 text-gray-400"
                      : "hover:bg-gray-100 text-gray-500"
                  }`}
                  title="Share"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div
          className={`mt-8 p-6 rounded-xl ${
            isDark ? "bg-gray-800/50" : "bg-white shadow-sm"
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-3 ${
              isDark ? "text-gray-200" : "text-gray-800"
            }`}
          >
            About this translator
          </h3>
          <div
            className={`text-sm space-y-2 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <p>
              This translator uses <strong>MyMemory</strong>, a free translation
              service powered by a large translation memory database with
              contributions from professional translators worldwide.
            </p>
            <p>
              <strong>Tips:</strong> For best results, use complete sentences
              rather than single words. The service works well with formal or
              conversational text.
            </p>
            <p className="text-xs opacity-75">
              Note: Free tier has usage limits. Machine translations may not
              always be accurate. Not suitable for official or certified
              translations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
