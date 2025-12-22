import { PlusCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { TextToSpeech } from "../components/TextToSpeech";
import api from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useToastStore } from "../store/toastStore";

interface Vocabulary {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  part_of_speech: string;
  jlpt_level: string | null;
  example_sentences?: Array<{ japanese: string; english: string }>;
  audio_url?: string;
  is_saved?: boolean;
}

export default function VocabularyPage() {
  const isDark = useThemeStore((state) => state.isDark);
  const addToast = useToastStore((state) => state.addToast);
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const jlptLevels = ["N5", "N4", "N3", "N2", "N1"];
  const partsOfSpeech = [
    "Noun",
    "Verb",
    "Adjective",
    "Adverb",
    "Expression",
    "Counter",
    "Pronoun",
    "Prefix",
    "Suffix",
    "Conjunction",
    "Interjection",
  ];

  const pageSize = 50;

  const fetchVocabulary = async (
    pageNum: number,
    level: string | null,
    pos: string | null,
    query: string
  ) => {
    try {
      setLoading(pageNum === 1);
      const params: Record<string, string | number> = {
        page: pageNum,
        page_size: pageSize,
      };
      if (level) params.jlpt_level = level;
      if (pos) params.part_of_speech = pos;
      if (query) params.search = query;

      const resp = await api.get("/vocabulary/words/", { params });
      const words = resp.data.results || [];

      // Check which words are already in flashcards
      const wordIds = words.map((w: Vocabulary) => w.id);
      if (wordIds.length > 0) {
        try {
          const checkResp = await api.post(
            "/srs/cards/check_vocabulary_batch/",
            {
              vocabulary_ids: wordIds,
            }
          );
          const savedIds = checkResp.data.saved_ids || [];
          const wordsWithSavedStatus = words.map((w: Vocabulary) => ({
            ...w,
            is_saved: savedIds.includes(w.id),
          }));
          setVocabulary(wordsWithSavedStatus);
        } catch (err) {
          console.error("Error checking saved status:", err);
          setVocabulary(words);
        }
      } else {
        setVocabulary(words);
      }

      setPage(pageNum);
      setTotalCount(resp.data.count || null);
    } catch (err) {
      console.error("Error fetching vocabulary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabulary(1, selectedLevel, selectedPos, searchQuery);
  }, [selectedLevel, selectedPos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVocabulary(1, selectedLevel, selectedPos, searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  const toggleSaved = async (wordId: number) => {
    try {
      // Add to flashcards
      const response = await api.post("/srs/cards/add_vocabulary/", {
        vocabulary_id: wordId,
      });

      if (response.status === 201) {
        addToast("Added to flashcards!", "success");
      } else if (response.status === 200) {
        addToast("Already in flashcards!", "info");
      }

      setVocabulary((prev) =>
        prev.map((w) => (w.id === wordId ? { ...w, is_saved: true } : w))
      );
    } catch (err: any) {
      if (err.response?.status === 200) {
        addToast("Already in flashcards!", "info");
        setVocabulary((prev) =>
          prev.map((w) => (w.id === wordId ? { ...w, is_saved: true } : w))
        );
      } else {
        console.error("Error adding to flashcards:", err);
        addToast("Failed to add to flashcards", "error");
      }
    }
  };

  const canPrev = page > 1;
  const canNext = totalCount ? page * pageSize < totalCount : false;

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
            Vocabulary
          </h1>
          <p
            className={`text-lg max-w-3xl mx-auto ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Learn essential Japanese words for JLPT all levels. Filter by word
            type to see all variations (e.g., Noun includes pronouns, Verb
            includes all verb types).
          </p>
        </div>

        {/* Level Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedLevel(null)}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedLevel === null
                ? "bg-primary-600 text-white"
                : isDark
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Words
          </button>
          {jlptLevels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedLevel === level
                  ? "bg-primary-600 text-white"
                  : isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {level} Vocabulary
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <input
              type="text"
              placeholder="Search Japanese, English, or romaji..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>

          {/* Part of Speech Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPos(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedPos === null
                  ? "bg-primary-600 text-white"
                  : isDark
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All Types
            </button>
            {partsOfSpeech.map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPos(pos)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPos === pos
                    ? "bg-primary-600 text-white"
                    : isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div
          className={`text-sm mb-4 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Showing {vocabulary.length} of {totalCount ?? "?"} words (page {page})
        </div>

        {/* Vocabulary Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : vocabulary.length === 0 ? (
          <div className="text-center py-12">
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              No vocabulary found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vocabulary.map((word) => (
              <div
                key={word.id}
                className={`relative p-6 rounded-2xl border transition-all hover:scale-105 ${
                  isDark
                    ? "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700"
                    : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
                }`}
              >
                {/* Add to Flashcards Button */}
                <button
                  onClick={() => toggleSaved(word.id)}
                  className={`absolute top-4 right-4 transition-colors ${
                    word.is_saved
                      ? "text-primary-500"
                      : "text-gray-400 hover:text-primary-500"
                  }`}
                  title="Add to Flashcards"
                >
                  <PlusCircle
                    className={`w-5 h-5 ${
                      word.is_saved ? "fill-primary-500" : ""
                    }`}
                  />
                </button>

                {/* Word */}
                <div className="text-3xl font-bold mb-2 japanese-text text-primary-600">
                  {word.word}
                </div>

                {/* Reading */}
                <div
                  className={`text-sm mb-3 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {word.reading}
                </div>

                {/* Meaning */}
                <div
                  className={`text-lg mb-4 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {word.meaning}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {word.jlpt_level && (
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {word.jlpt_level}
                    </span>
                  )}
                  {word.part_of_speech && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isDark
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {word.part_of_speech.split(",")[0].trim()}
                    </span>
                  )}
                </div>

                {/* Example Sentences */}
                {word.example_sentences &&
                  word.example_sentences.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {word.example_sentences
                        .slice(0, 2)
                        .map((example, idx) => (
                          <div
                            key={idx}
                            className={`text-sm p-3 rounded-lg ${
                              isDark ? "bg-gray-800" : "bg-gray-100"
                            }`}
                          >
                            <p className="japanese-text mb-1">
                              {example.japanese}
                            </p>
                            <p
                              className={`text-xs ${
                                isDark ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {example.english}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}

                {/* Audio/TTS Button */}
                <div className="mt-3">
                  <TextToSpeech
                    text={`${word.word}。${word.meaning}`}
                    language="ja"
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() =>
              fetchVocabulary(page - 1, selectedLevel, selectedPos, searchQuery)
            }
            disabled={!canPrev}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              canPrev
                ? "bg-primary-500 hover:bg-primary-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Previous
          </button>
          <span className={isDark ? "text-gray-400" : "text-gray-600"}>
            Page {page}
          </span>
          <button
            onClick={() =>
              fetchVocabulary(page + 1, selectedLevel, selectedPos, searchQuery)
            }
            disabled={!canNext}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              canNext
                ? "bg-primary-500 hover:bg-primary-600 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
