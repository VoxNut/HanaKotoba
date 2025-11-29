import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DrawInput } from "../components/draw-input";
import { Examples } from "../components/examples";
import { Graphs } from "../components/graphs";
import { KanjiStrokeAnimation } from "../components/kanji-animation";
import { Radical } from "../components/radical";
import { useThemeStore } from "../store/themeStore";

import type { BothGraphData, KanjiInfo } from "@/types/kanji";

export default function KanjiGraphPage() {
  const isDark = useThemeStore((s) => s.isDark);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const params = useParams();
  const routeKanji = params?.kanji as string | undefined;

  const [kanjiInfo, setKanjiInfo] = useState<KanjiInfo | null>(null);
  const [graphData, setGraphData] = useState<BothGraphData | null>(null);
  const [strokeSvg, setStrokeSvg] = useState<string | null>(null);

  useEffect(() => {
    // Sync with route param
    if (routeKanji) {
      setSelected(routeKanji);
      setQuery(routeKanji);
    }
  }, [routeKanji]);

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
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-12 gap-6">
        {/* Left: Search + Handwriting */}
        <div className="col-span-3 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Search kanji
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type character, reading, or meaning..."
              className={`w-full px-3 py-2 rounded-md border ${
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

          <div>
            <label className="block text-sm font-medium mb-2">Draw kanji</label>
            <DrawInput />
          </div>
        </div>

        {/* Middle: Kanji details + SVG */}
        <div className="col-span-6">
          <div
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-800" : "bg-white"
            } h-full`}
          >
            <h2 className="text-xl font-bold mb-2">Kanji</h2>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 flex items-center justify-center">
                <div className="text-[5.5rem] leading-none drop-shadow-md">
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
                            JLPT: <strong>{kanjiInfo.jlpt_level}</strong>
                          </span>
                        )}
                        {kanjiInfo?.taughtIn && (
                          <span>
                            Taught in grade:{" "}
                            <strong>{kanjiInfo.taughtIn}</strong>
                          </span>
                        )}
                      </p>
                      <p>
                        Stroke count:{" "}
                        <strong>
                          {kanjiInfo.stroke_count ??
                            kanjiInfo?.kanjialiveData?.strokeCount ??
                            "n/a"}
                        </strong>
                      </p>
                      <p>
                        Meaning:{" "}
                        <strong>
                          {kanjiInfo.meaning ??
                            kanjiInfo.jishoData?.meaning ??
                            "n/a"}
                        </strong>
                      </p>
                      <p>
                        Kunyomi:{" "}
                        <strong>
                          {kanjiInfo.kun_reading ??
                            (kanjiInfo.jishoData?.kunyomi ?? []).join(", ")}
                        </strong>
                      </p>
                      <p>
                        Onyomi:{" "}
                        <strong>
                          {kanjiInfo.on_reading ??
                            (kanjiInfo.jishoData?.onyomi ?? []).join(", ")}
                        </strong>
                      </p>
                      <p>
                        Composition:{" "}
                        <strong>
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

            {/* SVG stroke animation preview */}
            <div className="mt-4">
              {strokeSvg ? (
                <div className="w-full p-2 rounded bg-muted">
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
          </div>
        </div>

        {/* Right: Radical */}
        <div className="col-span-3">
          <div
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-800" : "bg-white"
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
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-800" : "bg-white"
            } h-full`}
          >
            <h3 className="sr-only">Examples</h3>
            <Examples kanjiInfo={kanjiInfo} />
          </div>
        </div>

        <div className="col-span-8">
          <div
            className={`p-4 rounded-lg ${
              isDark ? "bg-gray-800" : "bg-white"
            } h-full`}
          >
            <h3 className="text-lg font-bold mb-2">
              Decomposition / Composition Graph
            </h3>
            <div style={{ height: 520 }}>
              <Graphs kanjiInfo={kanjiInfo} graphData={graphData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
