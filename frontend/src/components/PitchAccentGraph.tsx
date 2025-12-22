import { useEffect, useRef, useState } from "react";
import { useThemeStore } from "../store/themeStore";
import {
  analyzePitchAccent,
  analyzePitchAccentApi,
  flattenMoraData,
  type MoraInfo,
} from "../utils/pitchAccent";

// Configuration: use API by default, fallback to client-side if API fails
const USE_API = true;

interface PitchAccentGraphProps {
  text: string;
  className?: string;
}

export function PitchAccentGraph({
  text,
  className = "",
}: PitchAccentGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDark = useThemeStore((state) => state.isDark);
  const [moraData, setMoraData] = useState<MoraInfo[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze text asynchronously
  useEffect(() => {
    if (!text.trim()) {
      setMoraData([]);
      return;
    }

    let cancelled = false;
    setIsAnalyzing(true);

    // Try API first, fallback to client-side analysis
    const analyze = async () => {
      try {
        if (USE_API) {
          return await analyzePitchAccentApi(text);
        } else {
          return await analyzePitchAccent(text);
        }
      } catch (apiError) {
        console.warn(
          "API analysis failed, falling back to client-side:",
          apiError
        );
        return await analyzePitchAccent(text);
      }
    };

    analyze()
      .then((words) => {
        if (!cancelled) {
          const flattened = flattenMoraData(words);
          setMoraData(flattened);
          setIsAnalyzing(false);
        }
      })
      .catch((error) => {
        console.error("Pitch accent analysis error:", error);
        if (!cancelled) {
          setMoraData([]);
          setIsAnalyzing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [text]);

  // Draw canvas when moraData changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || moraData.length === 0) {
      // Clear canvas if no data
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    // Canvas setup
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const padding = 40;
    const graphHeight = 100;
    const moraSpacing = 50;
    const canvasWidth = Math.max(
      600,
      moraData.length * moraSpacing + padding * 2
    );
    const canvasHeight = graphHeight + padding * 2 + 40; // extra space for labels

    // Set canvas size with DPR scaling
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Colors based on theme
    const lineColor = isDark ? "#f97316" : "#ea580c"; // orange
    const textColor = isDark ? "#e5e7eb" : "#374151"; // gray
    const particleColor = isDark ? "#ef4444" : "#dc2626"; // red
    const gridColor = isDark ? "#374151" : "#d1d5db";
    const downstepColor = isDark ? "#fbbf24" : "#f59e0b"; // yellow/amber

    // Draw reference lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // High line
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(canvasWidth - padding, padding);
    ctx.stroke();

    // Low line
    ctx.beginPath();
    ctx.moveTo(padding, padding + graphHeight);
    ctx.lineTo(canvasWidth - padding, padding + graphHeight);
    ctx.stroke();

    ctx.setLineDash([]);

    // Calculate positions
    const getY = (pitch: "high" | "low") => {
      return pitch === "high" ? padding : padding + graphHeight;
    };

    const getX = (index: number) => {
      return padding + index * moraSpacing;
    };

    // Draw pitch contour line
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    moraData.forEach((mora, idx) => {
      const x = getX(idx);
      const y = getY(mora.pitch);

      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points and downstep markers
    moraData.forEach((mora, idx) => {
      const x = getX(idx);
      const y = getY(mora.pitch);

      // Draw point
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw downstep marker (circle with X)
      if (mora.isDownstep) {
        ctx.strokeStyle = downstepColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Draw X inside circle
        const offset = 5;
        ctx.beginPath();
        ctx.moveTo(x - offset, y - offset);
        ctx.lineTo(x + offset, y + offset);
        ctx.moveTo(x + offset, y - offset);
        ctx.lineTo(x - offset, y + offset);
        ctx.stroke();
      }
    });

    // Draw mora labels below the graph
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    moraData.forEach((mora, idx) => {
      const x = getX(idx);
      const y = padding + graphHeight + 15;

      // Color particles in red
      ctx.fillStyle = mora.isParticle ? particleColor : textColor;
      ctx.fillText(mora.mora, x, y);
    });

    // Draw legend labels
    ctx.font = "12px sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("High", 5, padding);
    ctx.fillText("Low", 5, padding + graphHeight);
  }, [moraData, isDark]);

  if (isAnalyzing) {
    return (
      <div
        className={`flex items-center justify-center h-32 border rounded-lg ${
          isDark
            ? "bg-gray-800/50 border-gray-700 text-gray-400"
            : "bg-gray-50 border-gray-200 text-gray-500"
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
          <p className="text-sm">Analyzing pitch accent...</p>
        </div>
      </div>
    );
  }

  if (!text.trim()) {
    return (
      <div
        className={`flex items-center justify-center h-32 border rounded-lg ${
          isDark
            ? "bg-gray-800/50 border-gray-700 text-gray-500"
            : "bg-gray-50 border-gray-200 text-gray-400"
        } ${className}`}
      >
        <p className="text-sm">
          Enter Japanese text to see pitch accent visualization
        </p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto border rounded-lg ${
        isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"
      } ${className}`}
    >
      <canvas ref={canvasRef} className="mx-auto" />
    </div>
  );
}
