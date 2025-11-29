import searchlist from "@/../data/searchlist.json";
import Handwriting from "@/lib/handwriting";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";
import { CircleXIcon, SearchIcon } from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";
import { TouchIsolator } from "./touch-isolator";
import { Button, buttonVariants } from "./ui/button";

export const DrawInput: React.FC = () => {
  const canvasRef = React.useRef(null);
  const [canvas, setCanvas] = React.useState<InstanceType<
    typeof Handwriting.Canvas
  > | null>(null);
  const [inputSuggestions, setInputSuggestions] = React.useState<string[]>([]);

  const isDark = useThemeStore((s) => s.isDark);

  const inputOptions = {
    width: 220,
    height: 220,
    language: "ja",
    numOfWords: 1,
    numOfReturn: 64,
  };

  const inputCallback = (result: string[], err: string) => {
    if (err) {
      return;
    } else {
      const kanjiList = searchlist.map((entry) => entry.k);
      const filtered = result
        .filter((entry) => kanjiList.includes(entry))
        .slice(0, 4);
      setInputSuggestions(filtered);
    }
  };

  // init: create handwriting canvas when component mounts or theme toggles
  React.useEffect(() => {
    // clear suggestions from any previous input
    setInputSuggestions([]);
    if (canvasRef.current) {
      const themeStr = isDark ? "dark" : "light";
      const can = new Handwriting.Canvas(canvasRef.current, themeStr);
      setCanvas(can);
      return () => {
        // cleanup: try to erase and release canvas handlers
        try {
          can.erase();
        } catch (e) {
          // ignore
        }
      };
    }
    // no-op cleanup
    return () => {};
  }, [isDark]);

  const recognizeKanji = () => {
    canvas?.recognize(canvas.getTrace(), inputOptions, inputCallback);
  };

  const eraseKanji = () => {
    canvas && canvas.erase();
    setInputSuggestions([]);
  };

  return (
    <div className="relative w-[220px] h-[220px] mx-auto bg-background">
      <div className="absolute left-1/2 h-full border-l border-dashed border-slate-600/20 dark:border-slate-600/60 pointer-events-none z-10" />
      <div className="absolute top-1/2 w-full border-t border-dashed border-slate-600/20 dark:border-slate-600/60 pointer-events-none z-10" />
      <TouchIsolator>
        <canvas
          width={220}
          height={220}
          ref={canvasRef}
          id="handInput"
          className="relative w-[220px] h-[220px] border border-light rounded-lg cursor-crosshair bg-muted"
        />
      </TouchIsolator>
      <div className="h-10 w-full pt-2 flex items-center justify-between">
        <Button
          aria-label="Clear canvas"
          variant="destructive"
          size="icon"
          className="w-8 h-8 shrink-0"
          onClick={eraseKanji}
        >
          <CircleXIcon className="w-4 h-4" />
        </Button>
        {inputSuggestions.map((suggestion, index) => (
          <Link
            key={index}
            to={`/kanji-graph/${suggestion}`}
            className={cn(buttonVariants({ variant: "ghost" }), "w-8 h-8")}
            onClick={eraseKanji}
          >
            {suggestion}
          </Link>
        ))}
        <Button
          variant="default"
          size="icon"
          className="w-8 h-8 shrink-0"
          aria-label="Recognize"
          onClick={recognizeKanji}
        >
          <SearchIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
