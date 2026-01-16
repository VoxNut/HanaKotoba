/**
 * TextBoxPopup Component
 *
 * Displays detailed information about a manga text box:
 * - Original text with furigana
 * - Pitch accent visualization
 * - Translation
 * - Add to flashcards button
 */

import { Check, Copy, Plus, Volume2, X } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { EnrichedTextBox, PitchAccentWord } from "../../services/mangaApi";

interface TextBoxPopupProps {
  box: EnrichedTextBox;
  position: { x: number; y: number };
  onClose: () => void;
  onAddToFlashcards?: (
    text: string,
    reading: string,
    translation: string
  ) => void;
  isDark: boolean;
}

export default function TextBoxPopup({
  box,
  position,
  onClose,
  onAddToFlashcards,
  isDark,
}: TextBoxPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Adjust position to keep popup in viewport
  useEffect(() => {
    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        popupRef.current.style.left = `${
          position.x - rect.width / 2 - (rect.right - viewportWidth)
        }px`;
      }
      if (rect.bottom > viewportHeight) {
        popupRef.current.style.top = `${position.y - rect.height - 20}px`;
      }
    }
  }, [position]);

  // Speak the text using TTS
  const handleSpeak = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(box.text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // Copy text to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(box.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Add to flashcards
  const handleAddToFlashcards = () => {
    if (onAddToFlashcards) {
      const reading =
        box.tokens?.map((t) => t.reading || t.surface).join("") || box.text;
      onAddToFlashcards(box.text, reading, box.translation || "");
    }
  };

  // Get reading for display
  const getReading = () => {
    if (box.tokens && box.tokens.length > 0) {
      return box.tokens.map((t) => t.reading || t.surface).join("");
    }
    return null;
  };

  const reading = getReading();

  return (
    <div
      ref={popupRef}
      className={`absolute z-50 w-80 rounded-xl shadow-2xl overflow-hidden ${
        isDark
          ? "bg-gray-800 border border-gray-700"
          : "bg-white border border-gray-200"
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: "translateX(-50%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b ${
          isDark ? "bg-gray-750 border-gray-700" : "bg-gray-50 border-gray-200"
        }`}
      >
        <span
          className={`text-sm font-medium ${
            isDark ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Text Details
        </span>
        <button
          onClick={onClose}
          className={`p-1 rounded-full transition-colors ${
            isDark
              ? "hover:bg-gray-700 text-gray-400"
              : "hover:bg-gray-200 text-gray-500"
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Original Text with Reading */}
        <div>
          <div
            className={`text-2xl font-bold mb-1 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {box.text}
          </div>
          {reading && reading !== box.text && (
            <div
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {reading}
            </div>
          )}
        </div>

        {/* Pitch Accent Visualization */}
        {box.pitch_accent && box.pitch_accent.length > 0 && (
          <div className="space-y-2">
            <h4
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Pitch Accent
            </h4>
            <div className="flex flex-wrap gap-2">
              {box.pitch_accent.map((word, idx) => (
                <PitchAccentDisplay key={idx} word={word} isDark={isDark} />
              ))}
            </div>
          </div>
        )}

        {/* Translation */}
        {box.translation && (
          <div>
            <h4
              className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Translation
            </h4>
            <div
              className={`text-sm ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {box.translation}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
          <button
            onClick={handleSpeak}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            title="Speak"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            title="Copy"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {onAddToFlashcards && (
            <button
              onClick={handleAddToFlashcards}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors"
              title="Add to Flashcards"
            >
              <Plus className="w-4 h-4" />
              Flashcard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Pitch Accent Visualization ====================

interface PitchAccentDisplayProps {
  word: PitchAccentWord;
  isDark: boolean;
}

function PitchAccentDisplay({ word, isDark }: PitchAccentDisplayProps) {
  if (!word.morae || word.morae.length === 0) {
    return (
      <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        {word.word}
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col items-center">
      {/* Pitch line visualization */}
      <div className="flex items-end h-6 mb-0.5">
        {word.morae.map((mora, idx) => {
          const isHigh = mora.pitch === "H";
          const nextMora = word.morae[idx + 1];
          const isDropPoint = mora.is_accented;

          return (
            <div key={idx} className="flex items-end">
              {/* Mora with pitch indicator */}
              <div className="relative flex flex-col items-center">
                {/* Pitch dot/line */}
                <div
                  className={`w-full h-0.5 absolute ${
                    isHigh ? "top-0" : "top-3"
                  } ${isDark ? "bg-primary-400" : "bg-primary-500"}`}
                  style={{ minWidth: "1rem" }}
                />
                {/* Downstep marker */}
                {isDropPoint && nextMora && (
                  <div
                    className={`absolute right-0 w-0.5 h-3 top-0 ${
                      isDark ? "bg-red-400" : "bg-red-500"
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Morae text */}
      <div className="flex">
        {word.morae.map((mora, idx) => (
          <span
            key={idx}
            className={`text-sm px-0.5 ${
              mora.is_accented
                ? "text-red-500 font-bold"
                : isDark
                ? "text-gray-300"
                : "text-gray-700"
            }`}
          >
            {mora.mora}
          </span>
        ))}
      </div>

      {/* Pattern label */}
      <span
        className={`text-xs mt-0.5 ${
          isDark ? "text-gray-500" : "text-gray-400"
        }`}
      >
        {word.pattern}
        {word.pitch_number !== null && ` (${word.pitch_number})`}
      </span>
    </div>
  );
}
