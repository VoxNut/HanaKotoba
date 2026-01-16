/**
 * MangaReaderPage
 *
 * Full page wrapper for the MangaReader component.
 * Provides navigation and flashcard integration.
 */

import { BookOpen, Check, Home, Library, Plus, X } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MangaReader from "../components/manga/MangaReader";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function MangaReaderPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const initialVolumeId = searchParams.get("volume");

  // Flashcard creation state
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [flashcardData, setFlashcardData] = useState({
    text: "",
    reading: "",
    translation: "",
  });
  const [flashcardSaved, setFlashcardSaved] = useState(false);

  // Handle add to flashcards from MangaReader
  const handleAddToFlashcards = (
    text: string,
    reading: string,
    translation: string
  ) => {
    setFlashcardData({ text, reading, translation });
    setShowFlashcardModal(true);
    setFlashcardSaved(false);
  };

  // Save flashcard
  const handleSaveFlashcard = async () => {
    // TODO: Integrate with your flashcard API
    // For now, just show success
    console.log("Saving flashcard:", flashcardData);
    setFlashcardSaved(true);
    setTimeout(() => {
      setShowFlashcardModal(false);
    }, 1500);
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        isDark
          ? "bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"
          : "bg-gradient-to-b from-pink-50 via-white to-gray-50"
      }`}
    >
      {/* Header */}
      <header
        className={`${
          isDark ? "bg-gray-800/50" : "bg-white/80"
        } backdrop-blur-sm border-b ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary-500" />
            <h1
              className={`text-2xl font-bold tracking-wider ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              <span className="text-primary-500">Manga</span>
              <span className={isDark ? "text-gray-300" : "text-gray-700"}>
                Reader
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {!isAuthenticated && (
              <Link
                to="/login"
                className="text-sm text-primary-500 hover:text-primary-400"
              >
                Login to save flashcards
              </Link>
            )}
            <Link
              to="/library"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-gray-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <Library className="w-5 h-5" />
              <span className="text-sm">Library</span>
            </Link>
            <Link
              to="/"
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? "hover:bg-gray-700 text-gray-400"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <Home className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <MangaReader
          onAddToFlashcards={
            isAuthenticated ? handleAddToFlashcards : undefined
          }
          initialVolumeId={initialVolumeId ?? undefined}
        />
      </main>

      {/* Flashcard Modal */}
      {showFlashcardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={`w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
              isDark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3
                className={`text-lg font-semibold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Add to Flashcards
              </h3>
              <button
                onClick={() => setShowFlashcardModal(false)}
                className={`p-1 rounded-full ${
                  isDark
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Front (Japanese) */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Front (Japanese)
                </label>
                <input
                  type="text"
                  value={flashcardData.text}
                  onChange={(e) =>
                    setFlashcardData({ ...flashcardData, text: e.target.value })
                  }
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {/* Reading */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Reading
                </label>
                <input
                  type="text"
                  value={flashcardData.reading}
                  onChange={(e) =>
                    setFlashcardData({
                      ...flashcardData,
                      reading: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {/* Back (Translation) */}
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Back (Translation)
                </label>
                <textarea
                  value={flashcardData.translation}
                  onChange={(e) =>
                    setFlashcardData({
                      ...flashcardData,
                      translation: e.target.value,
                    })
                  }
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveFlashcard}
                disabled={flashcardSaved}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  flashcardSaved
                    ? "bg-green-500 text-white"
                    : "bg-primary-500 hover:bg-primary-600 text-white"
                }`}
              >
                {flashcardSaved ? (
                  <>
                    <Check className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Save Flashcard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
