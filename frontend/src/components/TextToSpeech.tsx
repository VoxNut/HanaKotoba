import { Download, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useThemeStore } from "../store/themeStore";
import { useToastStore } from "../store/toastStore";
import { ttsService, waitForVoices } from "../utils/textToSpeech";

interface TextToSpeechProps {
  text: string;
  language?: "ja" | "en" | "auto";
  compact?: boolean;
  className?: string;
}

export function TextToSpeech({
  text,
  language = "auto",
  compact = false,
  className = "",
}: TextToSpeechProps) {
  const isDark = useThemeStore((state) => state.isDark);
  const addToast = useToastStore((state) => state.addToast);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Load voices
    const loadVoices = async () => {
      const availableVoices = await waitForVoices();
      setVoices(availableVoices);

      // Auto-select appropriate voice based on language
      let defaultVoice: SpeechSynthesisVoice | null = null;
      if (language === "ja") {
        defaultVoice =
          availableVoices.find((v) => v.lang.startsWith("ja")) || null;
      } else if (language === "en") {
        defaultVoice =
          availableVoices.find((v) => v.lang.startsWith("en")) || null;
      } else {
        // Auto-detect: prefer Japanese for Japanese text
        const hasJapaneseChars =
          /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
        if (hasJapaneseChars) {
          defaultVoice =
            availableVoices.find((v) => v.lang.startsWith("ja")) || null;
        } else {
          defaultVoice =
            availableVoices.find((v) => v.lang.startsWith("en")) || null;
        }
      }

      if (defaultVoice) {
        setSelectedVoice(defaultVoice);
      }
    };

    loadVoices();
  }, [text, language]);

  const handlePlay = () => {
    if (!text.trim()) {
      addToast("No text to speak", "error");
      return;
    }

    if (isPaused) {
      ttsService.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);

    ttsService.speak(text, {
      voice: selectedVoice || undefined,
      rate,
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
      },
      onError: (error) => {
        console.error("TTS Error:", error);
        addToast("Failed to play speech", "error");
        setIsPlaying(false);
        setIsPaused(false);
      },
    });
  };

  const handlePause = () => {
    if (isPlaying) {
      ttsService.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    ttsService.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleDownload = async () => {
    if (!text.trim()) {
      addToast("No text to download", "error");
      return;
    }

    setIsDownloading(true);
    try {
      const filename = `speech-${Date.now()}.webm`;
      await ttsService.downloadAsAudio(text, filename, {
        voice: selectedVoice || undefined,
        rate,
      });
      addToast("Audio downloaded successfully!", "success");
    } catch (error) {
      console.error("Download error:", error);
      addToast("Failed to download audio", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const getFilteredVoices = () => {
    if (language === "ja") {
      return voices.filter((v) => v.lang.startsWith("ja"));
    } else if (language === "en") {
      return voices.filter((v) => v.lang.startsWith("en"));
    }
    return voices;
  };

  const filteredVoices = getFilteredVoices();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={isPlaying || isPaused ? handleStop : handlePlay}
          className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors"
          disabled={isDownloading}
        >
          {isPlaying || isPaused ? (
            <>
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Playing...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span className="text-sm">Play Audio</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Voice Selection */}
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Voice
        </label>
        <select
          value={selectedVoice?.name || ""}
          onChange={(e) => {
            const voice = filteredVoices.find((v) => v.name === e.target.value);
            setSelectedVoice(voice || null);
          }}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            isDark
              ? "bg-gray-800 border-gray-700 text-white"
              : "bg-white border-gray-300 text-gray-900"
          }`}
        >
          {filteredVoices.length === 0 && (
            <option value="">No voices available</option>
          )}
          {filteredVoices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </div>

      {/* Speed Control */}
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Speed: {rate.toFixed(2)}x
        </label>
        {/* compute percent and apply to WebKit track so gradient is visible */}
        {/* eslint-disable @typescript-eslint/ban-ts-comment */}
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className={`w-full rounded-lg appearance-none cursor-pointer ${
            isDark ? "bg-gray-700" : "bg-gray-300"
          }`}
          style={
            {
              height: 10,
              WebkitAppearance: "none",
            } as React.CSSProperties
          }
        />
        <style>{`
          input[type="range"] {
            background-repeat: no-repeat;
          }
          /* WebKit track (Chrome, Edge, Safari) - use gradient on track */
          input[type="range"]::-webkit-slider-runnable-track {
            height: 10px;
            border-radius: 999px;
            background: linear-gradient(to right, #f97316 0%, #f97316 ${
              ((rate - 0.5) / 1.5) * 100
            }%, ${isDark ? "#374151" : "#d1d5db"} ${
          ((rate - 0.5) / 1.5) * 100
        }%, ${isDark ? "#374151" : "#d1d5db"} 100%);
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            margin-top: -4px; /* center the thumb on the track */
            border-radius: 50%;
            background: #f97316;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          }
          /* Firefox */
          input[type="range"]::-moz-range-track {
            height: 10px;
            border-radius: 999px;
            background: ${isDark ? "#1f2937" : "#e5e7eb"};
          }
          input[type="range"]::-moz-range-progress {
            background: #f97316;
            height: 10px;
            border-radius: 999px;
          }
          input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #f97316;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            border: none;
          }
        `}</style>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        {!isPlaying && !isPaused ? (
          <button
            onClick={handlePlay}
            disabled={isDownloading || !text.trim()}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isDownloading || !text.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-primary-500 hover:bg-primary-600 text-white"
            }`}
          >
            <Play className="w-4 h-4" />
            Play
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-600 text-white transition-all"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
            <button
              onClick={handleStop}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isDark
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-red-500 hover:bg-red-600"
              } text-white`}
            >
              Stop
            </button>
          </>
        )}

        <button
          onClick={handleDownload}
          disabled={isDownloading || isPlaying || !text.trim()}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            isDownloading || isPlaying || !text.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : isDark
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
          title="Download as audio"
        >
          {isDownloading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          ) : (
            <Download className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
