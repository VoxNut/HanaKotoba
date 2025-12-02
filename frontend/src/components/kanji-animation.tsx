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
  // helper to read CSS variable and normalize RGB triples to rgb(...)
  const cssVar = (name: string, fallback = "") => {
    try {
      const v = getComputedStyle(document.body).getPropertyValue(name);
      const raw = (v || fallback).trim() || fallback;
      if (
        raw &&
        !raw.startsWith("#") &&
        !/^rgba?\(/i.test(raw) &&
        /[0-9]/.test(raw)
      ) {
        const nums = raw.replace(/,/g, " ").trim();
        if (/^([0-9]+\s+){2}[0-9]+$/.test(nums)) {
          return `rgb(${nums})`;
        }
      }
      return raw;
    } catch {
      return fallback;
    }
  };
  const svgContainerRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [drawProgress, setDrawProgress] = React.useState(0);
  const [isUserSeeking, setIsUserSeeking] = React.useState(false);
  const totalLength = SVG_STROKE_LENGTH * (strokeCount || 0);
  const svgPathsRef = React.useRef<SVGPathElement[] | null>(null);
  const pathLengthsRef = React.useRef<number[] | null>(null);

  // Modify the SVG content to remove default animation
  const modifiedSvgContent = React.useMemo(() => {
    if (!svgContent) return "";
    return svgContent.replace(
      /animation:zk var\(--t\) linear forwards var\(--d\);/g,
      "animation: none;"
    );
  }, [svgContent]);

  // Check if SVG has animatable paths
  const hasAnimatablePaths = React.useMemo(() => {
    if (!svgContent) return false;
    return svgContent.includes("clip-path") && svgContent.includes("path");
  }, [svgContent]);

  // only inject the modified SVG once
  React.useEffect(() => {
    if (!svgContainerRef.current) return;
    // inject new svg content whenever modifiedSvgContent changes
    svgContainerRef.current.innerHTML = modifiedSvgContent;
    // clear any cached refs so re-calculation runs
    svgPathsRef.current = null;
    pathLengthsRef.current = null;
    // reset progress on new svg
    setDrawProgress(0);
  }, [modifiedSvgContent]);

  // Apply theme-aware color to injected SVG (and paths) when content or theme changes
  React.useEffect(() => {
    if (!svgContainerRef.current) return;
    const svgEl = svgContainerRef.current.querySelector("svg");
    if (!svgEl) return;
    const primaryColor = cssVar(
      isDark ? "--color-primary-400" : "--color-primary-600",
      isDark ? "#ffffff" : "#ef4444"
    );
    try {
      svgEl.style.setProperty("color", primaryColor);
      svgEl.classList.add("acjk");
    } catch (e) {
      /* ignore */
    }
    // ensure svg is visible & size set so it's rendered
    svgEl.style.setProperty("display", "block");
    svgEl.style.setProperty("width", "120px");
    svgEl.style.setProperty("height", "auto");

    const hasClipPaths = svgEl.querySelectorAll("path[clip-path]").length > 0;
    const selector = hasClipPaths ? "path[clip-path]" : "path";
    const paths = Array.from(
      svgEl.querySelectorAll(selector)
    ) as SVGPathElement[];
    const lengths: number[] = [];
    // compute a reasonable strokeWidth from the svg viewBox (fallback to 8)
    const svgSvg = svgEl as SVGSVGElement;
    let strokeWidth = 8;
    try {
      const vbH = svgSvg.viewBox?.baseVal?.height;
      if (vbH && !isNaN(vbH)) strokeWidth = Math.max(1, Math.round(vbH / 30));
    } catch (e) {
      /* ignore */
    }
    paths.forEach((p) => {
      let len = SVG_STROKE_LENGTH;
      try {
        len = Math.round(p.getTotalLength() || SVG_STROKE_LENGTH);
      } catch (e) {
        len = SVG_STROKE_LENGTH;
      }
      try {
        p.setAttribute("stroke", primaryColor);
        p.style.setProperty("stroke", primaryColor);
      } catch (e) {
        /* ignore */
      }
      // ensure stroke width and other attributes
      try {
        p.setAttribute("stroke-width", String(strokeWidth));
      } catch (e) {
        /* ignore */
      }
      lengths.push(len);
    });
    pathLengthsRef.current = lengths;
    svgPathsRef.current = paths;
  }, [modifiedSvgContent, isDark]);

  // Animation loop
  React.useEffect(() => {
    if (
      !isPlaying ||
      !strokeCount ||
      isUserSeeking ||
      totalLength === 0 ||
      !hasAnimatablePaths
    )
      return;

    let frame: number;
    const FRAMES_PER_STROKE = 2 * 60; // 2s per stroke at 60fps
    const totalFrames = strokeCount * FRAMES_PER_STROKE;
    const INCREMENT = totalLength / totalFrames;
    const animate = () => {
      setDrawProgress((prev) => {
        const next = prev + INCREMENT;
        if (next >= totalLength) {
          return 0; // loop
        }
        return next;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, isUserSeeking, totalLength, strokeCount, hasAnimatablePaths]);

  // Update the stroke dash offset based on drawProgress to control animation progress
  React.useEffect(() => {
    if (!svgContainerRef.current) return;
    const animatedPaths = svgContainerRef.current.querySelectorAll(
      "svg.acjk path[clip-path]"
    );
    let lengthCoveredByPreviousStrokes = 0;

    animatedPaths.forEach((path) => {
      const strokeStartPoint = lengthCoveredByPreviousStrokes;
      const strokeEndPoint = lengthCoveredByPreviousStrokes + SVG_STROKE_LENGTH;
      let strokeOffset = SVG_STROKE_LENGTH;
      if (drawProgress >= strokeEndPoint) {
        strokeOffset = 0;
      } else if (drawProgress > strokeStartPoint) {
        const amountDrawn = drawProgress - strokeStartPoint;
        strokeOffset = SVG_STROKE_LENGTH - amountDrawn;
      }
      (path as HTMLElement).style.strokeDashoffset = String(strokeOffset);
      lengthCoveredByPreviousStrokes += SVG_STROKE_LENGTH;
    });
  }, [isPlaying, drawProgress]);

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
      {hasAnimatablePaths ? (
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
            max={totalLength}
            value={[drawProgress]}
            onValueChange={(vals: number[]) => setDrawProgress(vals[0])}
            className="w-20 h-4"
            disabled={totalLength === 0}
            onPointerDown={handleSliderMouseDown}
            onPointerUp={handleSliderMouseUp}
            onTouchStart={handleSliderTouchStart}
            onTouchEnd={handleSliderTouchEnd}
          />
        </div>
      ) : (
        <div className="text-xs text-muted-foreground mt-2">
          Static image (no stroke animation available)
        </div>
      )}
    </div>
  );
}
