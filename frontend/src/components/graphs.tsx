"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import type { BothGraphData, KanjiInfo } from "@/types/kanji";
import { ResizeObserver } from "@juggle/resize-observer";
import { useAtom } from "jotai";
import {
  ArrowUpFromDotIcon,
  CircleArrowOutUpRightIcon,
  MaximizeIcon,
  RefreshCcwIcon,
} from "lucide-react";

import { usePathname } from "next/navigation";
import * as React from "react";
import useMeasure from "react-use-measure";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

import {
  outLinksAtom,
  particlesAtom,
  rotateAtom,
  styleAtom,
} from "@/lib/store";

const Graph2DNoSSR = React.lazy(() => import("./graph-2D"));
const Graph3DNoSSR = React.lazy(() => import("./graph-3D"));

interface Props {
  kanjiInfo: KanjiInfo | null;
  graphData: BothGraphData | null;
}

export const Graphs: React.FC<Props> = ({ kanjiInfo, graphData }) => {
  const [measureRef, bounds] = useMeasure({
    polyfill: ResizeObserver,
    // debounce: 50,
  });

  const [style, setStyle] = useAtom(styleAtom);
  const [rotate, setRotate] = useAtom(rotateAtom);
  const [outLinks, setOutLinks] = useAtom(outLinksAtom);
  const [particles, setParticles] = useAtom(particlesAtom);

  const handleRotateChange = (value: boolean) => {
    React.startTransition(() => setRotate(value));
  };
  const handleStyleChange = (value: string) => {
    React.startTransition(() => setStyle(value as "3D" | "2D"));
  };
  const handleOutLinksChange = (value: boolean) => {
    // Outlinks toggle is user-facing and should be instant — avoid batching with startTransition
    setOutLinks(value);
  };
  const handleParticlesChange = (value: boolean) => {
    // Particles toggle is small and user-perceivable; apply immediately
    setParticles(value);
  };

  const [tabValue] = React.useState(0);
  const [random, setRandom] = React.useState<number>(Date.now());

  const handleZoomToFit = () => {
    React.startTransition(() => setRandom(Date.now()));
  };

  const pathname = usePathname();

  // dedupeGraph ensures link endpoints are present in nodes list and adds `curvature` for bidirectional pairs
  const dedupeGraph = (
    g?: BothGraphData["withOutLinks"] | BothGraphData["noOutLinks"]
  ) => {
    if (!g) return undefined;
    const mapped = {
      nodes: [
        ...(g.nodes || []).map((n: any) => ({
          ...(n as any),
          id: String(n.id),
        })),
      ],
      links: (g.links || []).map((l: any) => ({ ...(l as any) })),
    } as BothGraphData["withOutLinks"] | BothGraphData["noOutLinks"];

    const pairMap = new Map<string, any>();
    const nodeMap = new Map<string, any>(
      mapped.nodes.map((n: any) => [String(n.id), n])
    );
    mapped.links.forEach((l: any) => {
      const source =
        typeof l.source === "object" ? String(l.source.id) : String(l.source);
      const target =
        typeof l.target === "object" ? String(l.target.id) : String(l.target);
      const key = `${source}->${target}`;
      const rev = `${target}->${source}`;
      if (!pairMap.has(rev)) {
        pairMap.set(key, l);
        l.curvature = 0;
      } else {
        const existing = pairMap.get(rev);
        existing.curvature = -0.2;
        l.curvature = 0.2;
      }
      // ensure nodes include both endpoints
      if (!nodeMap.has(source)) {
        const node = { id: source, data: { character: source } } as any;
        nodeMap.set(source, node);
        mapped.nodes.push(node);
      }
      if (!nodeMap.has(target)) {
        const node = { id: target, data: { character: target } } as any;
        nodeMap.set(target, node);
        mapped.nodes.push(node);
      }
    });
    return mapped;
  };

  if (!kanjiInfo) return <></>;

  return (
    <div ref={measureRef} className="relative size-full graphs">
      <div className="absolute top-4 left-4 z-50">
        <Tabs
          defaultValue={style}
          value={style}
          onValueChange={handleStyleChange}
        >
          <TabsList className="px-1">
            <TabsTrigger value="2D">2D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="absolute inset-0">
        {kanjiInfo && style === "3D" && (
          <React.Suspense fallback={<div />}>
            <Graph3DNoSSR
              key={tabValue + random + pathname + (outLinks ? "o" : "i")}
              kanjiInfo={kanjiInfo}
              graphData={
                {
                  withOutLinks: dedupeGraph(graphData?.withOutLinks),
                  noOutLinks: dedupeGraph(graphData?.noOutLinks),
                } as BothGraphData
              }
              showOutLinks={outLinks}
              showParticles={particles}
              autoRotate={rotate}
              triggerFocus={tabValue + random}
              bounds={bounds}
            />
          </React.Suspense>
        )}
        {kanjiInfo && style === "2D" && (
          <React.Suspense fallback={<div />}>
            <Graph2DNoSSR
              key={tabValue + random + pathname + (outLinks ? "o" : "i")}
              kanjiInfo={kanjiInfo}
              graphData={
                {
                  withOutLinks: dedupeGraph(graphData?.withOutLinks),
                  noOutLinks: dedupeGraph(graphData?.noOutLinks),
                } as BothGraphData
              }
              showOutLinks={outLinks}
              showParticles={particles}
              triggerFocus={tabValue + random}
              bounds={bounds}
            />
          </React.Suspense>
        )}
      </div>
      <div className="absolute top-0 right-0 p-4 flex gap-1">
        <div style={{ display: style === "3D" ? "block" : "none" }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                className={cn("size-10", rotate ? "bg-accent" : "")}
                variant="outline"
                aria-label="Autorotate"
                pressed={rotate}
                onPressedChange={handleRotateChange}
              >
                <RefreshCcwIcon className="size-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Autorotate</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                className={cn("size-10", particles ? "bg-accent" : "")}
                variant="outline"
                aria-label="Show arrow particles"
                pressed={particles}
                onPressedChange={handleParticlesChange}
              >
                <ArrowUpFromDotIcon className="size-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show arrow particles</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                className={cn("size-10", outLinks ? "bg-accent" : "")}
                variant="outline"
                aria-label="Show out links"
                pressed={outLinks}
                onPressedChange={handleOutLinksChange}
              >
                <CircleArrowOutUpRightIcon className="size-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show outgoing links</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Fit to screen"
                onClick={handleZoomToFit}
              >
                <MaximizeIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom to fit</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
