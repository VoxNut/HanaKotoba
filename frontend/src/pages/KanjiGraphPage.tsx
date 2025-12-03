import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DrawInput } from "../components/draw-input";
import { Examples } from "../components/examples";
import { Graphs } from "../components/graphs";
import { KanjiStrokeAnimation } from "../components/kanji-animation";
import { Radical } from "../components/radical";
import api from "../services/api";
import { useThemeStore } from "../store/themeStore";
import { useToastStore } from "../store/toastStore";

import type { BothGraphData, KanjiInfo } from "@/types/kanji";

export default function KanjiGraphPage() {
  const isDark = useThemeStore((s) => s.isDark);
  const addToast = useToastStore((state) => state.addToast);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showOutgoingLinks, setShowOutgoingLinks] = useState(true);
  const navigate = useNavigate();

  const params = useParams();
  const routeKanji = params?.kanji as string | undefined;

  const [kanjiInfo, setKanjiInfo] = useState<KanjiInfo | null>(null);
  const [graphData, setGraphData] = useState<BothGraphData | null>(null);
  const [strokeSvg, setStrokeSvg] = useState<string | null>(null);

  // Flashcard state
  const [isAlreadyInDeck, setIsAlreadyInDeck] = useState(false);

  useEffect(() => {
    // Sync with route param
    if (routeKanji) {
      setSelected(routeKanji);
      setQuery(routeKanji);
    }
  }, [routeKanji]);

  // Check if kanji is already in flashcard deck
  useEffect(() => {
    if (kanjiInfo?.dbId) {
      checkIfInDeck(kanjiInfo.dbId);
    } else {
      setIsAlreadyInDeck(false);
    }
  }, [kanjiInfo?.dbId]);

  // Check if kanji is in deck
  const checkIfInDeck = async (kanjiId: number) => {
    try {
      const response = await api.get(`/srs/cards/check_kanji/${kanjiId}/`);
      setIsAlreadyInDeck(response.data.exists || false);
    } catch (err) {
      console.log("Error checking deck status:", err);
      setIsAlreadyInDeck(false);
    }
  };

  // Add to flashcards handler
  const handleAddToFlashcards = async () => {
    if (!kanjiInfo?.dbId) return;

    try {
      const response = await api.post("/srs/cards/add_kanji/", {
        kanji_id: kanjiInfo.dbId,
      });

      if (response.status === 201) {
        addToast("Added to flashcards!", "success");
        setIsAlreadyInDeck(true);
      } else if (response.status === 200) {
        addToast("Already in flashcards!", "info");
        setIsAlreadyInDeck(true);
      }
    } catch (err: any) {
      if (err.response?.status === 200) {
        addToast("Already in flashcards!", "info");
        setIsAlreadyInDeck(true);
      } else {
        console.error("Error adding to flashcards:", err);
        addToast("Failed to add to flashcards", "error");
      }
    }
  };

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch(
          `/api/vocabulary/kanji/?search=${encodeURIComponent(q)}&page_size=10`
        );
        if (!resp.ok) throw new Error(`Search failed ${resp.status}`);
        const data = await resp.json();
        if (mounted) {
          const chars = (data.results || []).map((k: any) => k.character);
          setSuggestions(chars);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
        if (mounted) setSuggestions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [query]);

  useEffect(() => {
    if (!selected) return;
    let mounted = true;
    (async () => {
      try {
        // The backend ViewSet expects numeric PK for detail routes.
        // Use the list endpoint with `search` to find the kanji by character,
        // then use the returned object's `id` to fetch the SVG detail action.
        const listResp = await fetch(
          `/api/vocabulary/kanji/?search=${encodeURIComponent(
            selected
          )}&page_size=1`
        );
        if (!listResp.ok)
          throw new Error(`Kanji list API error ${listResp.status}`);
        const listData = await listResp.json();
        const first =
          Array.isArray(listData.results) && listData.results.length > 0
            ? listData.results[0]
            : null;
        if (!first) {
          if (mounted) {
            setKanjiInfo(null);
            setGraphData(null);
            setStrokeSvg(null);
          }
          return;
        }

        if (!mounted) return;

        // Fetch detailed record (list endpoint is preview-only)
        let fullKanji: any = first;
        try {
          const detailResp = await fetch(`/api/vocabulary/kanji/${first.id}/`);
          if (detailResp.ok) fullKanji = await detailResp.json();
        } catch (e) {
          console.warn("Failed to fetch kanji detail, using preview", e);
        }

        // Normalize examples into a consistent shape used by `Examples` component
        const normalizedExamples = Array.isArray(fullKanji.examples)
          ? (fullKanji.examples as any[])
              .map((ex) => {
                if (!ex) return null;
                if (typeof ex === "string") {
                  const parts = (ex as string).split("—").map((p) => p.trim());
                  const japanese = parts[0] ?? "";
                  const english = parts[1] ?? "";
                  return { japanese, meaning: { english }, audio: null };
                }
                const audioField: any =
                  ex?.audio || ex?.audioUrl || ex?.audio_url || null;
                let audioObj = null;
                if (audioField) {
                  if (typeof audioField === "string")
                    audioObj = { mp3: audioField };
                  else if (audioField?.mp3) audioObj = { mp3: audioField.mp3 };
                }
                const meaningObj =
                  typeof ex.meaning === "string"
                    ? { english: ex.meaning }
                    : ex.meaning && typeof ex.meaning?.english === "string"
                    ? { english: ex.meaning.english }
                    : ex.translation
                    ? { english: ex.translation }
                    : { english: "" };

                return {
                  japanese: ex.japanese || ex.word || ex.text || "",
                  meaning: meaningObj,
                  audio: audioObj,
                };
              })
              .filter(Boolean)
          : [];

        const adapted: any = {
          ...fullKanji,
          id: fullKanji.character,
          character: fullKanji.character,
          dbId: fullKanji.id,
          examples: normalizedExamples,
          svg_data: fullKanji.svg_data || undefined,
          jishoData: {
            meaning: fullKanji.meaning || null,
            kunyomi: fullKanji.kun_reading
              ? String(fullKanji.kun_reading)
                  .split(/[,・\s]+/)
                  .filter(Boolean)
              : [],
            onyomi: fullKanji.on_reading
              ? String(fullKanji.on_reading)
                  .split(/[,・\s]+/)
                  .filter(Boolean)
              : [],
            jlptLevel: fullKanji.jlpt_level || undefined,
            strokeCount: fullKanji.stroke_count || undefined,
            onyomiExamples:
              fullKanji.onyomi_examples || fullKanji.onyomiExamples || [],
            kunyomiExamples:
              fullKanji.kunyomi_examples || fullKanji.kunyomiExamples || [],
            radical: { symbol: fullKanji.radical || undefined },
          },
        };

        // Debug: print normalized examples to browser console so we can
        // confirm shapes and content during development.
        try {
          // eslint-disable-next-line no-console
          console.debug("Adapted examples:", normalizedExamples);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.debug("Failed to log adapted examples:", e);
        }
        try {
          // eslint-disable-next-line no-console
          console.debug("Adapted kanjiInfo:", adapted);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.debug("Failed to log adapted kanjiInfo:", e);
        }
        setKanjiInfo(adapted);

        // Fetch graph data from backend
        try {
          const graphResp = await fetch(
            `/api/vocabulary/kanji/${fullKanji.id}/graph/`
          );
          if (!graphResp.ok) {
            const txt = await graphResp.text();
            console.warn(
              `Graph endpoint returned non-OK status ${graphResp.status}:`,
              txt
            );
            if (mounted) setGraphData(null);
          } else {
            // Try to parse JSON; if it fails we'll log text for debugging
            try {
              const graph = await graphResp.json();
              if (mounted) setGraphData(graph);
            } catch (parseErr) {
              const txt = await graphResp.text();
              console.warn(
                "Graph endpoint returned non-JSON response:",
                txt,
                parseErr
              );
              if (mounted) setGraphData(null);
            }
          }
        } catch (e) {
          console.error("Failed to fetch graph endpoint:", e);
          if (mounted) setGraphData(null);
        }

        // Fetch SVG from animCJK repository; fall back to DB svg_data if external fetch fails
        try {
          const unicode = fullKanji.character.codePointAt(0);
          const svgResp = await fetch(
            `https://raw.githubusercontent.com/parsimonhi/animCJK/master/svgsJa/${unicode}.svg`
          );
          if (svgResp.ok) {
            const svgText = await svgResp.text();
            if (mounted) setStrokeSvg(svgText);
          } else {
            if (mounted) setStrokeSvg(fullKanji.svg_data || null);
          }
        } catch (e) {
          if (mounted) setStrokeSvg(fullKanji.svg_data || null);
        }
      } catch (err) {
        console.error("Failed to load kanji data:", err);
        if (mounted) {
          setKanjiInfo(null);
          setGraphData(null);
          setStrokeSvg(null);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selected]);

  return (
    <div
      className={`min-h-screen bg-transparent ${
        isDark ? "text-white" : "text-gray-900"
      }`}
    >
      {/* Top: Search, Kanji Details, and Radical */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-12 gap-6">
        {/* Left: Search + Handwriting */}
        <div className="col-span-3 space-y-4">
          <div
            className={`p-4 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <label className="block text-sm font-medium mb-2">
              Search kanji
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type character, reading, or meaning..."
              className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            />
            {suggestions.length > 0 ? (
              <div className="mt-2 space-y-1 max-h-40 overflow-auto">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSelected(s);
                      setQuery(s);
                      setSuggestions([]);
                      navigate(`/kanji-graph/${s}`);
                    }}
                    className="w-full text-left px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    // use theme primary colors for text to match site
                    style={{
                      color:
                        getComputedStyle(document.body)
                          .getPropertyValue("--color-primary-600")
                          ?.trim() ||
                        (document.documentElement.classList.contains("dark")
                          ? "var(--color-primary-400)"
                          : "var(--color-primary-600)"),
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              query && (
                <div className="mt-2 text-sm text-muted-foreground">
                  No results
                </div>
              )
            )}
          </div>

          <div
            className={`p-4 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <label className="block text-sm font-medium mb-2">Draw kanji</label>
            <DrawInput />
          </div>
        </div>

        {/* Middle: Kanji details + SVG */}
        <div className="col-span-6">
          <div
            className={`p-6 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } min-h-0 h-full`}
          >
            <h2 className="text-xl font-bold mb-4 text-primary-600 dark:text-primary-400">
              Kanji
            </h2>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 flex items-center justify-center">
                <div className="text-[5.5rem] leading-none drop-shadow-md text-primary-600 dark:text-primary-400">
                  {kanjiInfo?.character ?? kanjiInfo?.id ?? "—"}
                </div>
              </div>
              <div className="col-span-8 text-sm">
                <div className="space-y-2">
                  {kanjiInfo ? (
                    <>
                      <p>
                        {kanjiInfo?.jlpt_level && (
                          <span className="mr-3">
                            JLPT:{" "}
                            <strong className="text-primary-600 dark:text-primary-400">
                              {kanjiInfo.jlpt_level}
                            </strong>
                          </span>
                        )}
                        {kanjiInfo?.taughtIn && (
                          <span>
                            Taught in grade:{" "}
                            <strong className="text-primary-600 dark:text-primary-400">
                              {kanjiInfo.taughtIn}
                            </strong>
                          </span>
                        )}
                      </p>
                      <p>
                        Stroke count:{" "}
                        <strong className="text-primary-600 dark:text-primary-400">
                          {kanjiInfo.stroke_count ??
                            kanjiInfo?.kanjialiveData?.strokeCount ??
                            "n/a"}
                        </strong>
                      </p>
                      <p>
                        Meaning:{" "}
                        <strong className="text-primary-600 dark:text-primary-400">
                          {kanjiInfo.meaning ??
                            kanjiInfo.jishoData?.meaning ??
                            "n/a"}
                        </strong>
                      </p>
                      <p>
                        Kunyomi:{" "}
                        <strong className="text-primary-600 dark:text-primary-400">
                          {kanjiInfo.kun_reading ??
                            (kanjiInfo.jishoData?.kunyomi ?? []).join(", ")}
                        </strong>
                      </p>
                      <p>
                        Onyomi:{" "}
                        <strong className="text-primary-600 dark:text-primary-400">
                          {kanjiInfo.on_reading ??
                            (kanjiInfo.jishoData?.onyomi ?? []).join(", ")}
                        </strong>
                      </p>
                      <p>
                        Composition:{" "}
                        <strong className="text-primary-600 dark:text-primary-400">
                          {(
                            graphData?.noOutLinks?.links
                              ?.filter((l: any) => l.target === kanjiInfo.id)
                              .map((l: any) => l.source) || []
                          ).join(", ")}
                        </strong>
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a kanji from search, draw suggestions or the graph.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Separator */}
            <div
              className={`my-6 border-t ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            />

            {/* SVG stroke animation preview */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-primary-600 dark:text-primary-400">
                Stroke Order
              </h3>
              {strokeSvg ? (
                <div className="w-full p-4 rounded-lg bg-muted">
                  <KanjiStrokeAnimation
                    svgContent={strokeSvg}
                    strokeCount={
                      kanjiInfo?.stroke_count ??
                      kanjiInfo?.kanjialiveData?.strokeCount ??
                      null
                    }
                    isDark={isDark}
                  />
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Stroke animation not available.
                </div>
              )}
            </div>

            {/* Flashcard Section */}
            {kanjiInfo && (
              <>
                {/* Separator */}
                <div
                  className={`my-6 border-t ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                />

                {/* Add to Flashcards Button */}
                <button
                  onClick={handleAddToFlashcards}
                  disabled={isAlreadyInDeck}
                  className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
                    isAlreadyInDeck
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-primary-500 hover:bg-primary-600 text-white"
                  }`}
                >
                  {isAlreadyInDeck ? "Already in Deck" : "Add to Flashcards"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Radical */}
        <div className="col-span-3">
          <div
            className={`p-6 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } h-full`}
          >
            <h2 className="sr-only">Radical</h2>
            <Radical kanjiInfo={kanjiInfo} />
          </div>
        </div>
      </div>

      {/* Bottom: Examples + Graph */}
      <div className="max-w-7xl mx-auto px-4 pb-12 grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <div
            className={`p-6 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
            style={{ height: "580px" }}
          >
            <h3 className="text-lg font-bold mb-4 text-primary-600">
              Examples
            </h3>
            <div
              className="overflow-auto"
              style={{ height: "calc(100% - 40px)" }}
            >
              <Examples kanjiInfo={kanjiInfo} />
            </div>
          </div>
        </div>

        <div className="col-span-8">
          <div
            className={`p-6 rounded-lg border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
            style={{ height: "580px" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-primary-600">
                Decomposition / Composition Graph
              </h3>
              <button
                onClick={() => setShowOutgoingLinks(!showOutgoingLinks)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showOutgoingLinks
                    ? "bg-primary-600 text-white"
                    : isDark
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {showOutgoingLinks ? "Show Incoming Only" : "Show Both Links"}
              </button>
            </div>
            <div style={{ height: "calc(100% - 60px)" }}>
              <Graphs
                kanjiInfo={kanjiInfo}
                graphData={graphData}
                showOutgoingLinks={showOutgoingLinks}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
