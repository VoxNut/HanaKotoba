import { Button } from "@/components/ui/button";
import { CirclePauseIcon, CirclePlayIcon } from "lucide-react";
import * as React from "react";
import { Slider } from "./ui/slider";

type Props = {
  svgContent: string;
  strokeCount: number | null;
  isDark?: boolean;
};

const SVG_STROKE_LENGTH = 3337; // Default path length for each stroke.

export function KanjiStrokeAnimation({
  svgContent,
  strokeCount,
  isDark,
}: Props) {
  const svgContainerRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [drawProgress, setDrawProgress] = React.useState(0);
  const [isUserSeeking, setIsUserSeeking] = React.useState(false);
  // store measured path lengths in a ref to avoid re-renders
  const pathLengthsRef = React.useRef<number[] | null>(null);
  const [measuredTotal, setMeasuredTotal] = React.useState<number>(0);

  // Modify the SVG content to remove default animation
  const modifiedSvgContent = React.useMemo(() => {
    if (!svgContent) return "";
    return svgContent.replace(
      /animation:zk var\(--t\) linear forwards var\(--d\);/,
      "animation: none;"
    );
  }, [svgContent]); // only recompute when svgContent changes

  // Inject the SVG whenever content changes and initialize stroke data
  React.useEffect(() => {
    if (!svgContainerRef.current) return;
    svgContainerRef.current.innerHTML = modifiedSvgContent;
    setDrawProgress(0);
    pathLengthsRef.current = null;
    setMeasuredTotal(0);

    // choose animCJK stroke selector, fallback to any path (query inside the svg element)
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;
    // Ensure the SVG is visible and inherits colors from the parent
    svgEl.style.display = "block";
    svgEl.style.width = "120px";
    svgEl.style.height = "auto";
    // When in dark mode, force the SVG color to white so strokes are visible
    svgEl.style.color = isDark ? "#ffffff" : "inherit";
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    // Force visible and override hiding attributes
    svgEl.style.setProperty("opacity", "1");
    svgEl.style.setProperty("visibility", "visible");
    svgEl.style.setProperty("display", "block");
    svgEl.style.setProperty("pointer-events", "none");
    // apply to child groups
    Array.from(svgEl.querySelectorAll("g")).forEach((g: Element) => {
      try {
        (g as HTMLElement).style.setProperty("opacity", "1");
        (g as HTMLElement).style.setProperty("visibility", "visible");
        (g as HTMLElement).style.setProperty("display", "block");
      } catch (e) {
        /* ignore */
      }
    });
    const hasClipPaths = svgEl.querySelectorAll("path[clip-path]").length > 0;
    const selector = hasClipPaths ? "path[clip-path]" : "path";
    // collect paths and dedupe by 'd' attribute (many animCJK svgs have duplicate masks/paths)
    const rawPaths = Array.from(
      svgEl.querySelectorAll(selector)
    ) as SVGPathElement[];
    const seenD = new Set<string>();
    const paths: SVGPathElement[] = [];
    const maybeOrder = (p: SVGPathElement) => {
      const candidates = [
        p.getAttribute("data-order"),
        p.getAttribute("data-index"),
        p.getAttribute("data-stroke"),
        p.getAttribute("data-id"),
        p.id,
      ];
      for (const c of candidates) {
        if (!c) continue;
        const match = c.match(/(\d+)/);
        if (match) return Number(match[1]);
        const parsed = Number(c);
        if (!isNaN(parsed)) return parsed;
      }
      return undefined;
    };

    rawPaths.forEach((p) => {
      try {
        const d = (p.getAttribute("d") || "").trim();
        if (!d) return;
        if (seenD.has(d)) return; // skip duplicates
        seenD.add(d);
        paths.push(p);
      } catch (e) {
        // fallback: include path
        paths.push(p);
      }
    });
    // Try to order paths by explicit stroke data attributes if exists
    const hasOrder = rawPaths.some((p) => maybeOrder(p) !== undefined);
    if (hasOrder) {
      paths.sort((a, b) => {
        const oa = maybeOrder(a) ?? 0;
        const ob = maybeOrder(b) ?? 0;
        return oa - ob;
      });
    }
    // compute a reasonable stroke width from the svg viewBox (fallback to 8)
    const svgSvg = svgEl as SVGSVGElement;
    let strokeWidth = 8;
    try {
      const vbH = svgSvg.viewBox?.baseVal?.height;
      if (vbH && !isNaN(vbH)) strokeWidth = Math.max(1, Math.round(vbH / 30));
    } catch (e) {
      /* ignore */
    }
    const lengths: number[] = [];
    let total = 0;
    paths.forEach((p) => {
      let len = SVG_STROKE_LENGTH;
      try {
        // getTotalLength can throw for some elements; guard it
        len = Math.round(p.getTotalLength() || SVG_STROKE_LENGTH);
      } catch (e) {
        len = SVG_STROKE_LENGTH;
      }
      lengths.push(len);
      total += len;
      p.style.setProperty("stroke-dasharray", String(len));
      p.style.setProperty("stroke-dashoffset", String(len));
      p.style.setProperty("transition", "stroke-dashoffset 0ms linear");
      p.style.setProperty("animation", "none");
      // ensure stroke is visible; use currentColor so it adapts to theme
      const strokeAttr = p.getAttribute("stroke");
      if (!strokeAttr || strokeAttr === "none")
        p.setAttribute("stroke", "currentColor");
      // ensure opacity is visible
      p.setAttribute("opacity", "1");
      // remove fills that create a silhouette and set a visible stroke width
      p.setAttribute("fill", "none");
      p.setAttribute("stroke-width", String(strokeWidth));
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke-linejoin", "round");
      p.setAttribute("vector-effect", "non-scaling-stroke");
    });
    pathLengthsRef.current = lengths;
    setMeasuredTotal(total);
    // Attempt to compute a combined bounding box for the paths and scale the SVG to fit
    try {
      if (paths.length > 0) {
        let minX = Number.POSITIVE_INFINITY,
          minY = Number.POSITIVE_INFINITY,
          maxX = Number.NEGATIVE_INFINITY,
          maxY = Number.NEGATIVE_INFINITY;
        paths.forEach((p) => {
          try {
            const b = p.getBBox();
            if (b.x < minX) minX = b.x;
            if (b.y < minY) minY = b.y;
            if (b.x + b.width > maxX) maxX = b.x + b.width;
            if (b.y + b.height > maxY) maxY = b.y + b.height;
          } catch (e) {
            /* ignore */
          }
        });
        if (
          isFinite(minX) &&
          isFinite(minY) &&
          isFinite(maxX) &&
          isFinite(maxY)
        ) {
          const contentW = maxX - minX;
          const contentH = maxY - minY;
          const containerRect = svgContainerRef.current.getBoundingClientRect();
          const desiredW = Math.max(24, containerRect.width * 0.8);
          if (contentW > 0) {
            const scale = desiredW / contentW;
            if (scale !== 1) {
              const g = svgEl.querySelector("g") as SVGGElement | null;
              if (g) {
                const translate = `translate(${-minX},${-minY}) scale(${scale})`;
                g.setAttribute("transform", translate);
                g.style.setProperty("transform-origin", "0 0");
                g.style.setProperty("transform-box", "fill-box");
              } else {
                svgEl.setAttribute(
                  "viewBox",
                  `${minX} ${minY} ${contentW} ${contentH}`
                );
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore bbox/scale errors
    }
    // expose chosen stroke width for debug use
    setDebugStrokeWidth(strokeWidth);
    // small debug: record path count + dump attributes for first few paths
    try {
      console.debug(
        "kanji-animation: svg viewBox",
        svgSvg.viewBox.baseVal,
        "paths",
        paths.length,
        "total",
        total
      );
      paths.slice(0, 3).forEach((p, idx) => {
        console.debug(
          `path[${idx}] d length`,
          p.getAttribute("d")?.length,
          "fill",
          p.getAttribute("fill"),
          "stroke",
          p.getAttribute("stroke"),
          "strokeWidth",
          p.getAttribute("stroke-width")
        );
        try {
          const b = p.getBBox ? p.getBBox() : null;
          console.debug(
            `path[${idx}] bbox`,
            b ? { w: b.width, h: b.height } : null
          );
        } catch (e) {
          // ignore
        }
      });
    } catch (e) {
      // ignore debugging errors
    }
    // (we don't persist as state here to avoid extra renders during measurement)
    // default to playing
    setIsPlaying(true);
  }, [modifiedSvgContent, isDark]);

  // Timestamp-based RAF loop to advance drawProgress while playing
  React.useEffect(() => {
    const totalLen = measuredTotal || SVG_STROKE_LENGTH * (strokeCount || 0);
    if (!isPlaying || isUserSeeking || totalLen === 0) return;

    let raf = 0;
    let last = performance.now();
    const DURATION_PER_STROKE = 1500; // ms per stroke (adjusted for smoother pacing)
    const strokes = pathLengthsRef.current?.length ?? (strokeCount || 0);
    const totalDuration = Math.max(1, strokes * DURATION_PER_STROKE);
    const speed = totalLen / totalDuration; // px per ms

    const step = (ts: number) => {
      // guard against very large dt when tab was hidden or resumed
      const rawDt = Math.max(0, ts - last);
      const dt = Math.min(50, rawDt);
      last = ts;
      setDrawProgress((p) => {
        const next = p + dt * speed;
        if (next >= totalLen) return 0; // loop
        return next;
      });
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, isUserSeeking, measuredTotal, strokeCount]);

  // Update the stroke dash offset based on drawProgress to control animation progress
  React.useEffect(() => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;
    const hasClipPaths = svgEl.querySelectorAll("path[clip-path]").length > 0;
    const selector = hasClipPaths ? "path[clip-path]" : "path";
    const paths = Array.from(
      svgEl.querySelectorAll(selector)
    ) as SVGPathElement[];
    let covered = 0;
    const lengths =
      pathLengthsRef.current || paths.map(() => SVG_STROKE_LENGTH);
    paths.forEach((path, i) => {
      const len = lengths[i] || SVG_STROKE_LENGTH;
      const start = covered;
      const end = covered + len;
      let offset = len;
      if (drawProgress >= end) {
        offset = 0;
      } else if (drawProgress > start) {
        const amount = drawProgress - start;
        offset = Math.max(0, len - amount);
      }
      path.style.setProperty("stroke-dashoffset", String(offset));
      covered += len;
    });
  }, [isPlaying, drawProgress]);

  // Debug: expose number of measured paths for quick troubleshooting
  const [debugPathCount, setDebugPathCount] = React.useState<number | null>(
    null
  );
  const [debugStrokeWidth, setDebugStrokeWidth] = React.useState<number | null>(
    null
  );
  React.useEffect(() => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return setDebugPathCount(null);
    const hasClipPaths = svgEl.querySelectorAll("path[clip-path]").length > 0;
    const selector = hasClipPaths ? "path[clip-path]" : "path";
    const paths = Array.from(
      svgEl.querySelectorAll(selector)
    ) as SVGPathElement[];
    setDebugPathCount(paths.length);
  }, [modifiedSvgContent, measuredTotal]);

  // Play/Pause animation
  const handlePlayPauseClick = () => {
    setIsPlaying((prevIsPlaying) => !prevIsPlaying);
  };

  // Restart animation on SVG click
  const handleSvgClick = () => {
    setDrawProgress(0);
  };

  const handleSliderMouseDown = () => setIsUserSeeking(true);
  const handleSliderMouseUp = () => setIsUserSeeking(false);
  const handleSliderTouchStart = () => setIsUserSeeking(true);
  const handleSliderTouchEnd = () => setIsUserSeeking(false);

  return (
    <div className="kanji-svg-container flex flex-col items-center">
      <div
        ref={svgContainerRef}
        className="cursor-pointer"
        onClick={handleSvgClick}
      />
      <div className="text-xs text-muted-foreground mt-1">
        Paths: {debugPathCount ?? "-"} • Total len: {measuredTotal} • w:{" "}
        {debugStrokeWidth ?? "-"}
      </div>
      <div className="flex flex-row items-center gap-2 mt-2">
        <Button
          variant="link"
          size="icon"
          onClick={handlePlayPauseClick}
          className="h-6 w-6 p-0 m-0"
        >
          {isPlaying ? (
            <CirclePauseIcon className="h-4 w-4" />
          ) : (
            <CirclePlayIcon className="h-4 w-4" />
          )}
        </Button>
        <Slider
          min={0}
          max={Math.max(
            0,
            measuredTotal || SVG_STROKE_LENGTH * (strokeCount || 0)
          )}
          value={[drawProgress]}
          onValueChange={(vals: number[]) => setDrawProgress(vals[0])}
          className="w-20 h-4"
          disabled={
            (measuredTotal || SVG_STROKE_LENGTH * (strokeCount || 0)) === 0
          }
          onPointerDown={handleSliderMouseDown}
          onPointerUp={handleSliderMouseUp}
          onTouchStart={handleSliderTouchStart}
          onTouchEnd={handleSliderTouchEnd}
        />
      </div>
    </div>
  );
}
