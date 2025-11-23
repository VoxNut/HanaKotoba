import { Pause, Play, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ForceGraph2D } from "react-force-graph";
import api from "../services/api";
import { useThemeStore } from "../store/themeStore";

interface ExampleItem {
  jp: string;
  reading?: string;
  en: string;
}

interface KanjiPreview {
  id: number;
  character: string;
  meaning: string;
  jlpt_level?: string | null;
}

interface KanjiDetail extends KanjiPreview {
  kun_reading: string;
  on_reading: string;
  stroke_count: number;
  radical: string;
  frequency_rank?: number | null;
  examples: any[];
  composition: any[];
  svg_data?: string;
}

export default function KanjiGraphPage() {
  const isDark = useThemeStore((s) => s.isDark);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>("本");
  const [kanjiList, setKanjiList] = useState<KanjiPreview[]>([]);
  const [selectedKanji, setSelectedKanji] = useState<KanjiDetail | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchTimer = useRef<number | null>(null);
  const fgRef = useRef<any>(null);

  const examples: ExampleItem[] = useMemo(
    () => [
      { jp: "本", reading: "ほん", en: "book" },
      { jp: "本日", reading: "ほんじつ", en: "today" },
      { jp: "本店", reading: "ほんてん", en: "head office" },
      { jp: "本当に", reading: "ほんとうに", en: "really" },
      { jp: "基本", reading: "きほん", en: "basis" },
      { jp: "絵本", reading: "えほん", en: "picture book" },
    ],
    []
  );

  // fetch list from API (preview)
  const fetchList = async (search = "") => {
    try {
      setLoading(true);
      const params: any = { page_size: 40 };
      if (search) params.search = search;
      const res = await api.get("/vocabulary/kanji/", { params });
      setKanjiList(res.data.results || []);
      // auto-select first result
      if (res.data.results && res.data.results.length > 0) {
        const first: KanjiPreview = res.data.results[0];
        setSelected(first.character);
        fetchDetail(first.id);
      } else {
        setSelectedKanji(null);
      }
    } catch (err) {
      console.error("Failed to fetch kanji list", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (idOrChar: number | string) => {
    try {
      // If we get a char, try to find its id in list
      let id = typeof idOrChar === "number" ? idOrChar : undefined;
      if (!id) {
        const found = kanjiList.find((k) => k.character === idOrChar);
        if (found) id = found.id;
      }
      if (!id) {
        // fallback: try search by character and pick first
        const res = await api.get("/vocabulary/kanji/", {
          params: { search: idOrChar, page_size: 1 },
        });
        const first = res.data.results && res.data.results[0];
        id = first?.id;
      }
      if (!id) return;
      const res = await api.get(`/vocabulary/kanji/${id}/`);
      setSelectedKanji(res.data);
    } catch (err) {
      console.error("Failed to fetch kanji detail", err);
    }
  };

  useEffect(() => {
    // initial load
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // debounce search
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => {
      fetchList(query);
    }, 300);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Build force-graph data from selectedKanji
  const graphData = useMemo(() => {
    if (!selectedKanji) return { nodes: [], links: [] };
    const centerId = selectedKanji.character;
    const components = selectedKanji.composition || [];
    const nodes: any[] = [{ id: centerId, val: 3 }];
    const links: any[] = [];
    components.forEach((c: any) => {
      const compChar = typeof c === "string" ? c : c.component || String(c);
      nodes.push({ id: compChar, val: 1 });
      links.push({ source: centerId, target: compChar });
    });
    return { nodes, links };
  }, [selectedKanji]);

  return (
    <div
      className={`min-h-screen ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Search & small canvas */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className={`w-full pl-10 pr-3 py-2 rounded-md border ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            <div
              className={`h-56 rounded-md border p-2 ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="h-full flex items-center justify-center text-6xl japanese-text text-gray-300">
                {selected}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-md bg-red-600 text-white">
                ◉
              </button>
              <button
                className={`flex-1 rounded-md px-3 py-2 ${
                  isDark
                    ? "bg-gray-800 border border-gray-700 text-gray-200"
                    : "bg-white border border-gray-200 text-gray-900"
                }`}
              >
                Filters
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              {kanjiList.slice(0, 8).map((k) => (
                <button
                  key={k.id}
                  onClick={() => {
                    setSelected(k.character);
                    fetchDetail(k.id);
                  }}
                  className={`h-14 flex items-center justify-center rounded-md border ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <div className="text-2xl japanese-text">{k.character}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Center: Kanji Details & Examples */}
          <div className="col-span-12 lg:col-span-6">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="text-9xl font-bold japanese-text leading-none">
                  {selected}
                </div>
                <div
                  className={`mt-2 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {selectedKanji?.jlpt_level
                    ? `Jōyō kanji, Taught in grade 1`
                    : ""}
                </div>
                <div
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {selectedKanji?.jlpt_level
                    ? `JLPT level: ${selectedKanji.jlpt_level}`
                    : ""}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Meaning</h2>
                <p
                  className={`${
                    isDark ? "text-gray-100" : "text-gray-800"
                  } mb-4`}
                >
                  {selectedKanji?.meaning || "—"}
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setPlaying((p) => !p)}
                    className={`px-3 py-2 rounded-md ${
                      isDark
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    {playing ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <div
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Examples with audio
                  </div>
                </div>

                <div
                  className={`space-y-2 max-h-80 overflow-y-auto pr-2 ${
                    isDark ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  {(selectedKanji?.examples && selectedKanji.examples.length > 0
                    ? selectedKanji.examples
                    : examples
                  ).map((ex: any) => (
                    <div
                      key={ex.jp || ex.word}
                      className={`flex items-center justify-between p-3 rounded-md ${
                        isDark
                          ? "bg-gray-800 border border-gray-700"
                          : "bg-white border border-gray-100"
                      }`}
                    >
                      <div>
                        <div className="flex items-baseline gap-3">
                          <div className="japanese-text text-lg font-medium">
                            {ex.jp || ex.word || ex[0]}
                          </div>
                          {ex.reading && (
                            <div
                              className={`text-sm ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              ({ex.reading})
                            </div>
                          )}
                        </div>
                        <div
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {ex.en || ex.meaning || ex[1]}
                        </div>
                      </div>
                      <button
                        className={`ml-4 p-2 rounded-full ${
                          isDark ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        ▶
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Radical + Graph */}
          <div className="col-span-12 lg:col-span-3">
            <div
              className={`rounded-md p-4 mb-4 ${
                isDark
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm text-gray-400">Radical:</div>
                  <div className="japanese-text text-3xl font-semibold">
                    {selectedKanji?.radical || "木"}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Strokes: {selectedKanji?.stroke_count ?? "—"}
                </div>
              </div>
              <div className="mt-3 text-center text-gray-400">
                (radical illustration)
              </div>
            </div>

            <div
              className={`rounded-md p-3 ${
                isDark
                  ? "bg-gray-900 border border-gray-700"
                  : "bg-white border border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium">Graph</div>
                <div className="flex gap-2">
                  <button className="text-sm px-2 py-1 rounded-md border">
                    2D
                  </button>
                  <button className="text-sm px-2 py-1 rounded-md border">
                    3D
                  </button>
                </div>
              </div>

              <div className="w-full h-64">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
                  </div>
                )}
                <ForceGraph2D
                  ref={fgRef}
                  graphData={graphData as any}
                  nodeLabel={(n: any) => n.id}
                  nodeAutoColorBy={(n: any) =>
                    n.id === selected ? "center" : "comp"
                  }
                  nodeVal={(n: any) => n.val}
                  backgroundColor={isDark ? "#0f1724" : "#ffffff00"}
                  nodeCanvasObject={(
                    node: any,
                    ctx: CanvasRenderingContext2D,
                    globalScale: number
                  ) => {
                    const label = String(node.id);
                    const fontSize =
                      12 / (globalScale || 1) + (node.val === 3 ? 6 : 0);
                    ctx.beginPath();
                    ctx.fillStyle =
                      node.id === selected ? "#2563eb" : "#93c5fd";
                    const r = node.val === 3 ? 16 : 10;
                    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                    ctx.fill();
                    ctx.fillStyle = "#fff";
                    ctx.font = `${fontSize}px sans-serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(label, node.x, node.y);
                  }}
                  onNodeClick={(node: any) => {
                    setSelected(String(node.id));
                    fetchDetail(String(node.id));
                  }}
                  linkDirectionalParticles={0}
                  width={400}
                  height={256}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
