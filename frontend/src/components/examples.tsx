"use client";
import type { KanjiInfo } from "@/types/kanji";
import { CirclePlayIcon } from "lucide-react";
import * as React from "react";
import { Button } from "./ui/button";

export const Examples = ({ kanjiInfo }: { kanjiInfo: KanjiInfo | null }) => {
  // Debug: log incoming example data for troubleshooting
  try {
    // eslint-disable-next-line no-console
    console.debug("Examples component received:", kanjiInfo?.examples);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug("Failed to log examples in Examples component:", e);
  }
  const playSound = (url: string) => {
    const audio = new Audio(url);
    void audio.play();
  };

  const highlightKanji = (text: string) => {
    if (!kanjiInfo || !text) return text;
    const kanjiChar = kanjiInfo.character ?? kanjiInfo.id ?? "";
    const textArray = text.split(kanjiChar);
    return (
      <span>
        {textArray.map((item, index) => (
          <React.Fragment key={index}>
            {item}
            {index !== textArray.length - 1 && <b>{kanjiInfo?.character}</b>}
          </React.Fragment>
        ))}
      </span>
    );
  };

  const formatMeaning = (meaning: any) => {
    if (!meaning) return "";
    if (typeof meaning === "string") return meaning;
    // Return empty string if english key exists but is empty
    if (meaning?.english !== undefined && typeof meaning.english === "string")
      return meaning.english;
    try {
      return JSON.stringify(meaning);
    } catch (e) {
      return String(meaning);
    }
  };

  return (
    <div className="size-full overflow-auto">
      <div className="space-y-2">
        {/* Examples with audio (DB-provided `examples`) */}
        {(kanjiInfo?.examples || []).length > 0 && (
          <h5 className="text-foreground/50 text-sm my-2">
            Examples with audio
          </h5>
        )}
        {(kanjiInfo?.examples || []).map((example: any, index: number) => {
          return (
            <div
              className="flex justify-between align-end odd:bg-muted rounded-lg items-center pl-2"
              key={index}
            >
              <p>
                <span>
                  {highlightKanji(
                    example?.japanese || formatMeaning(example?.meaning)
                  )}
                  &nbsp;&nbsp;&nbsp;
                </span>
                <span>
                  {formatMeaning(example?.meaning) ||
                    example?.translation ||
                    ""}
                  {"  "}
                </span>
              </p>
              <Button
                aria-label="Play sound"
                variant="link"
                size="icon"
                onClick={() =>
                  example &&
                  (example.audio?.mp3 || example?.audio) &&
                  playSound(example?.audio?.mp3 || example?.audio)
                }
              >
                <CirclePlayIcon className="size-5" />
              </Button>
            </div>
          );
        })}
        {/* JISHO */}
        {kanjiInfo?.jishoData?.onyomiExamples &&
          kanjiInfo?.jishoData?.onyomiExamples?.length !== 0 && (
            <h5 className="text-foreground/50 text-sm my-2">Onyomi Examples</h5>
          )}
        {kanjiInfo?.jishoData?.onyomiExamples?.map(
          (onExample: any, index: number) => (
            <div
              key={index}
              className="flex justify-between align-end odd:bg-muted rounded-lg items-center p-2"
            >
              <p>
                {highlightKanji(onExample?.example)}
                {"  "}（{onExample?.reading}）{"  "}
                {formatMeaning(onExample?.meaning)}
              </p>
            </div>
          )
        )}
        {kanjiInfo?.jishoData?.kunyomiExamples &&
          kanjiInfo?.jishoData?.kunyomiExamples?.length !== 0 && (
            <h5 className="text-foreground/50 text-sm my-2">
              Kunyomi Examples
            </h5>
          )}
        {kanjiInfo?.jishoData?.kunyomiExamples?.map(
          (kunExample: any, index: number) => (
            <div
              key={index}
              className="flex justify-between align-end odd:bg-muted rounded-lg items-center p-2"
            >
              <p>
                {highlightKanji(kunExample?.example)}
                {"  "}（{kunExample?.reading}）{"  "}
                {formatMeaning(kunExample?.meaning)}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
