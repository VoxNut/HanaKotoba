import { Filter, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { useThemeStore } from "../store/themeStore";

interface Kanji {
  id: number;
  character: string;
  meaning: string;
  kun_reading: string;
  on_reading: string;
  jlpt_level: string | null;
  stroke_count: number;
  radical: string;
  frequency_rank: number | null;
  examples: string[];
}

export default function KanjiPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const [kanjis, setKanjis] = useState<Kanji[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJlpt, setSelectedJlpt] = useState<string | null>(null);
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);

  // Mnemonic generation state
  const [generatingMnemonic, setGeneratingMnemonic] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [mnemonicError, setMnemonicError] = useState<string | null>(null);

  // Flashcard state
  const [addingToFlashcards, setAddingToFlashcards] = useState(false);
  const [addedToFlashcards, setAddedToFlashcards] = useState(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);
  const [isAlreadyInDeck, setIsAlreadyInDeck] = useState(false);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(50); // matches backend default page_size
  const [totalCount, setTotalCount] = useState<number | null>(null);
  // Background fetch indicator (used when we already have results and are updating)
  const [fetching, setFetching] = useState<boolean>(false);

  // Stable fetch function that accepts filters explicitly to keep hook deps predictable
  const fetchKanjis = useCallback(
    async (
      pageToLoad: number = 1,
      jlptLevel?: string | null,
      search?: string
    ) => {
      // Treat loading the first page as the initial load (show large loader)
      const isInitialLoad = pageToLoad === 1;
      try {
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setFetching(true);
        }
        setError(null);
        // Build query params for server-side filtering/pagination
        const params: Record<string, string | number> = {
          page: pageToLoad,
          page_size: pageSize,
        };

        if (jlptLevel) {
          params.jlpt_level = jlptLevel;
        }

        if (search && search.trim().length > 0) {
          // DRF SearchFilter expects `search` query param by default
          params.search = search.trim();
        }

        const resp = await api.get(`/vocabulary/kanji/`, { params });

        const results: Kanji[] = resp.data.results || [];
        setKanjis(results);
        setPage(pageToLoad);
        setTotalCount(
          typeof resp.data.count === "number" ? resp.data.count : null
        );
      } catch (err: unknown) {
        console.error("Error fetching kanji:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load kanji";
        setError(errorMessage);
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        } else {
          setFetching(false);
        }
      }
    },
    [pageSize]
  );

  // When JLPT filter changes, ask server for page 1 of filtered results
  useEffect(() => {
    fetchKanjis(1, selectedJlpt, searchQuery);
  }, [selectedJlpt, fetchKanjis]);

  // Debounced search: when searchQuery changes, fetch page 1 after a short delay
  useEffect(() => {
    const t = setTimeout(() => {
      // Use the current selected JLPT level when applying the search
      fetchKanjis(1, selectedJlpt, searchQuery);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, fetchKanjis]);

  const jlptLevels = ["N5", "N4", "N3", "N2", "N1"];

  // Pagination helpers
  const canPrev = page > 1;
  const canNext = totalCount === null ? true : page * pageSize < totalCount;

  // Fetch existing mnemonic for the selected kanji
  const fetchExistingMnemonic = async (kanjiId: number) => {
    try {
      // Try to get existing mnemonic from the vocabulary endpoint
      const response = await api.get(`/vocabulary/kanji/${kanjiId}/mnemonics/`);
      if (response.data && response.data.length > 0) {
        // Get the user's mnemonic (first one should be theirs)
        setMnemonic(response.data[0].story);
      }
    } catch (err) {
      // No existing mnemonic, that's okay
      console.log("No existing mnemonic found");
    }
  };

  // Check if kanji is already in flashcard deck
  const checkIfInDeck = async (kanjiId: number) => {
    try {
      const response = await api.get(`/srs/cards/check_kanji/${kanjiId}/`);
      setIsAlreadyInDeck(response.data.exists || false);
    } catch (err) {
      // If endpoint doesn't exist or error, assume not in deck
      console.log("Error checking deck status:", err);
      setIsAlreadyInDeck(false);
    }
  };

  // Generate mnemonic handler
  const handleGenerateMnemonic = async () => {
    if (!selectedKanji) return;

    setGeneratingMnemonic(true);
    setMnemonicError(null);

    try {
      const response = await api.post("/ai/features/generate_mnemonic/", {
        kanji: selectedKanji.character,
        meaning: selectedKanji.meaning,
      });

      setMnemonic(response.data.mnemonic);
    } catch (err: unknown) {
      console.error("Error generating mnemonic:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate mnemonic";
      setMnemonicError(errorMessage);
    } finally {
      setGeneratingMnemonic(false);
    }
  };

  // Add to flashcards handler
  const handleAddToFlashcards = async () => {
    if (!selectedKanji) return;

    setAddingToFlashcards(true);
    setFlashcardError(null);

    try {
      await api.post("/srs/cards/add_kanji/", {
        kanji_id: selectedKanji.id,
      });

      setAddedToFlashcards(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setAddedToFlashcards(false), 3000);
    } catch (err: unknown) {
      console.error("Error adding to flashcards:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add to flashcards";
      setFlashcardError(errorMessage);
    } finally {
      setAddingToFlashcards(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setSelectedKanji(null);
    setMnemonic(null);
    setMnemonicError(null);
    setGeneratingMnemonic(false);
    setAddedToFlashcards(false);
    setFlashcardError(null);
    setIsAlreadyInDeck(false);
  };

  // Render mnemonic with bold text for **word**
  const renderMnemonic = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      // Odd indices are the text between ** **
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-bold">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary-600">
            Kanji Learning (漢字)
          </h1>
          <p
            className={`text-lg max-w-3xl mx-auto ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Master essential kanji characters with readings, meanings, and
            stroke order. Practice handwriting and create memorable mnemonics.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <input
              type="text"
              placeholder="Search by character, meaning, or reading..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-lg border ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-primary-500`}
            />
          </div>

          {/* JLPT Level Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-500" />
            <span
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              JLPT Level:
            </span>
            {jlptLevels.map((level) => (
              <button
                key={level}
                onClick={() =>
                  setSelectedJlpt(selectedJlpt === level ? null : level)
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedJlpt === level
                    ? "bg-primary-500 text-white"
                    : isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                {level}
              </button>
            ))}
            {selectedJlpt && (
              <button
                onClick={() => setSelectedJlpt(null)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isDark
                    ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                Clear
              </button>
            )}
          </div>

          {/* Results Count + Pagination Controls */}
          <div className="flex items-center justify-between">
            <div
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              } flex items-center gap-2`}
            >
              <span>
                Showing {kanjis.length} of {totalCount ?? "?"} kanji (page{" "}
                {page})
              </span>
              {fetching && (
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"
                  aria-hidden="true"
                ></div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  canPrev && fetchKanjis(page - 1, selectedJlpt, searchQuery)
                }
                disabled={!canPrev}
                className={`px-3 py-1 rounded ${
                  canPrev
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                Prev
              </button>
              <button
                onClick={() =>
                  canNext && fetchKanjis(page + 1, selectedJlpt, searchQuery)
                }
                disabled={!canNext}
                className={`px-3 py-1 rounded ${
                  canNext
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Kanji Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Loading kanji...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div
              className={`text-xl mb-4 ${
                isDark ? "text-primary-400" : "text-primary-600"
              }`}
            >
              ⚠️ Error Loading Kanji
            </div>
            <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {error}
            </p>
            <button
              onClick={() => fetchKanjis(page, selectedJlpt, searchQuery)}
              className="mt-4 bg-primary-500 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-all"
            >
              Try Again
            </button>
          </div>
        ) : kanjis.length === 0 ? (
          <div
            className={`text-center py-12 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <p className="text-xl">No kanji found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {kanjis.map((kanji) => (
              <button
                key={kanji.id}
                onClick={() => {
                  setSelectedKanji(kanji);
                  fetchExistingMnemonic(kanji.id);
                  checkIfInDeck(kanji.id);
                }}
                className={`aspect-square rounded-xl border transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                  isDark
                    ? "bg-gray-800 border-gray-700 hover:border-primary-600"
                    : "bg-white border-gray-200 hover:border-primary-400"
                }`}
              >
                <div className="h-full flex flex-col items-center justify-center p-2">
                  <div className="text-3xl md:text-4xl font-bold japanese-text mb-1">
                    {kanji.character}
                  </div>
                  {kanji.jlpt_level && (
                    <div className="text-xs text-primary-500 font-medium">
                      {kanji.jlpt_level}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Kanji Detail Modal */}
        {selectedKanji && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className={`max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl ${
                isDark ? "bg-gray-800" : "bg-white"
              } p-8 relative`}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className={`absolute top-4 right-4 p-2 rounded-lg ${
                  isDark
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <X className="w-6 h-6" />
              </button>

              {/* Kanji Character */}
              <div className="text-center mb-8">
                <div className="text-8xl font-bold japanese-text mb-4">
                  {selectedKanji.character}
                </div>
                {selectedKanji.jlpt_level && (
                  <span className="inline-block bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    {selectedKanji.jlpt_level}
                  </span>
                )}
              </div>

              {/* Meanings */}
              <div className="mb-6">
                <h3
                  className={`text-sm font-medium mb-2 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Meaning
                </h3>
                <p
                  className={`text-xl ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {selectedKanji.meaning}
                </p>
              </div>

              {/* Readings */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3
                    className={`text-sm font-medium mb-2 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Kun Reading (訓読み)
                  </h3>
                  <p
                    className={`text-lg japanese-text ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedKanji.kun_reading || "—"}
                  </p>
                </div>
                <div>
                  <h3
                    className={`text-sm font-medium mb-2 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    On Reading (音読み)
                  </h3>
                  <p
                    className={`text-lg japanese-text ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedKanji.on_reading || "—"}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div
                  className={`text-center p-4 rounded-lg ${
                    isDark ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <div
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Strokes
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedKanji.stroke_count}
                  </div>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${
                    isDark ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <div
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Radical
                  </div>
                  <div className="text-2xl font-bold japanese-text">
                    {selectedKanji.radical || "—"}
                  </div>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${
                    isDark ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <div
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Rank
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedKanji.frequency_rank || "—"}
                  </div>
                </div>
              </div>

              {/* Mnemonic Section */}
              {mnemonic && (
                <div
                  className={`mb-6 p-4 rounded-lg border-l-4 ${
                    isDark
                      ? "bg-primary-900/20 border-primary-500"
                      : "bg-primary-50 border-primary-500"
                  }`}
                >
                  <h3
                    className={`text-sm font-medium mb-2 ${
                      isDark ? "text-primary-400" : "text-primary-600"
                    }`}
                  >
                    💡 Mnemonic Story
                  </h3>
                  <p
                    className={`text-base leading-relaxed ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {renderMnemonic(mnemonic)}
                  </p>
                </div>
              )}

              {/* Mnemonic Error */}
              {mnemonicError && (
                <div
                  className={`mb-6 p-4 rounded-lg border-l-4 ${
                    isDark
                      ? "bg-red-900/20 border-red-500"
                      : "bg-red-50 border-red-500"
                  }`}
                >
                  <p className="text-sm text-red-600">⚠️ {mnemonicError}</p>
                </div>
              )}

              {/* Flashcard Success Message */}
              {addedToFlashcards && (
                <div
                  className={`mb-4 p-4 rounded-lg border-l-4 ${
                    isDark
                      ? "bg-green-900/20 border-green-500"
                      : "bg-green-50 border-green-500"
                  }`}
                >
                  <p className="text-sm text-green-600">
                    ✓ Added to flashcards!
                  </p>
                </div>
              )}

              {/* Already in Deck Message */}
              {isAlreadyInDeck && !addedToFlashcards && (
                <div
                  className={`mb-4 p-4 rounded-lg border-l-4 ${
                    isDark
                      ? "bg-blue-900/20 border-blue-500"
                      : "bg-blue-50 border-blue-500"
                  }`}
                >
                  <p className="text-sm text-blue-600">
                    ℹ️ This kanji is already in your flashcard deck
                  </p>
                </div>
              )}

              {/* Flashcard Error */}
              {flashcardError && (
                <div
                  className={`mb-4 p-4 rounded-lg border-l-4 ${
                    isDark
                      ? "bg-red-900/20 border-red-500"
                      : "bg-red-50 border-red-500"
                  }`}
                >
                  <p className="text-sm text-red-600">⚠️ {flashcardError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 bg-primary-500 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-all">
                  Practice Writing
                </button>
                <button
                  onClick={handleGenerateMnemonic}
                  disabled={generatingMnemonic}
                  className={`flex-1 border px-6 py-3 rounded-lg font-medium transition-all ${
                    generatingMnemonic
                      ? "opacity-50 cursor-not-allowed"
                      : isDark
                      ? "border-gray-600 hover:bg-gray-700 text-white"
                      : "border-gray-300 hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  {generatingMnemonic ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Generating...
                    </span>
                  ) : mnemonic ? (
                    "Regenerate Mnemonic"
                  ) : (
                    "Create Mnemonic"
                  )}
                </button>
              </div>

              {/* Add to Flashcards Button */}
              <button
                onClick={handleAddToFlashcards}
                disabled={
                  addingToFlashcards || addedToFlashcards || isAlreadyInDeck
                }
                className={`w-full mt-3 px-6 py-3 rounded-lg font-medium transition-all ${
                  addedToFlashcards
                    ? "bg-green-500 text-white cursor-default"
                    : isAlreadyInDeck
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : addingToFlashcards
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-primary-500 hover:bg-primary-600 text-white"
                }`}
              >
                {addingToFlashcards ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </span>
                ) : addedToFlashcards ? (
                  "✓ Added to Flashcards"
                ) : isAlreadyInDeck ? (
                  "Already in Deck"
                ) : (
                  "Add to Flashcards"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
