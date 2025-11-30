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
  const [filteredKanjis, setFilteredKanjis] = useState<Kanji[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJlpt, setSelectedJlpt] = useState<string | null>(null);
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);

  useEffect(() => {
    fetchKanjis();
  }, []);

  const fetchKanjis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all kanji (handle pagination)
      let allKanjis: Kanji[] = [];
      let nextUrl: string | null = "/vocabulary/kanji/";

      while (nextUrl) {
        const response: { data: { results?: Kanji[]; next?: string | null } } =
          await api.get(nextUrl);
        const results = response.data.results || [];
        allKanjis = [...allKanjis, ...results];

        // Get next page URL (remove the base URL part if present)
        nextUrl = response.data.next || null;
        if (nextUrl) {
          nextUrl = nextUrl
            .replace(/^https?:\/\/[^/]+/, "")
            .replace("/api", "");
        }
      }

      console.log(`Loaded ${allKanjis.length} kanji`);
      setKanjis(allKanjis);
    } catch (error: unknown) {
      console.error("Error fetching kanji:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load kanji";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterKanjis = useCallback(() => {
    let filtered = kanjis;

    // Filter by JLPT level
    if (selectedJlpt) {
      filtered = filtered.filter((k) => k.jlpt_level === selectedJlpt);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (k) =>
          k.character.includes(query) ||
          k.meaning.toLowerCase().includes(query) ||
          k.kun_reading.toLowerCase().includes(query) ||
          k.on_reading.toLowerCase().includes(query)
      );
    }

    setFilteredKanjis(filtered);
  }, [kanjis, selectedJlpt, searchQuery]);

  useEffect(() => {
    filterKanjis();
  }, [filterKanjis]);

  const jlptLevels = ["N5", "N4", "N3", "N2", "N1"];

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
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

          {/* Results Count */}
          <div
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Showing {filteredKanjis.length} of {kanjis.length} kanji
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
              onClick={fetchKanjis}
              className="mt-4 bg-primary-500 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-all"
            >
              Try Again
            </button>
          </div>
        ) : filteredKanjis.length === 0 ? (
          <div
            className={`text-center py-12 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <p className="text-xl">No kanji found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {filteredKanjis.map((kanji) => (
              <button
                key={kanji.id}
                onClick={() => setSelectedKanji(kanji)}
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
                onClick={() => setSelectedKanji(null)}
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

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="flex-1 bg-primary-500 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-all">
                  Practice Writing
                </button>
                <button
                  className={`flex-1 border px-6 py-3 rounded-lg font-medium transition-all ${
                    isDark
                      ? "border-gray-600 hover:bg-gray-700 text-white"
                      : "border-gray-300 hover:bg-gray-100 text-gray-900"
                  }`}
                >
                  Create Mnemonic
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
