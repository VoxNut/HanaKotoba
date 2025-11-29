"use client";

import kanjilist from "@/../data/kanjilist.json";
import type { BothGraphData, KanjiInfo } from "@/types/kanji";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";
import type { ForceGraphMethods, GraphData } from "react-force-graph-3d";
import ForceGraph3D, { LinkObject, NodeObject } from "react-force-graph-3d";
import type { RectReadOnly } from "react-use-measure";
import * as THREE from "three";
import SpriteText from "three-spritetext";

type NodeObjectWithData = NodeObject & { data: KanjiInfo };

interface Props {
  kanjiInfo: KanjiInfo;
  graphData: BothGraphData | null;
  showOutLinks: boolean;
  triggerFocus: number;
  bounds: RectReadOnly;
  autoRotate: boolean;
  showParticles: boolean;
}

export const dynamic = "force-dynamic";

const Graph3D = ({
  kanjiInfo,
  graphData,
  showOutLinks,
  triggerFocus,
  bounds,
  autoRotate,
  showParticles,
}: Props) => {
  const joyoList = kanjilist.filter((el) => el.g === 1).map((el) => el.k);
  const jinmeiyoList = kanjilist.filter((el) => el.g === 2).map((el) => el.k);

  const { resolvedTheme } = useTheme();

  const fg3DRef: React.MutableRefObject<ForceGraphMethods | undefined> =
    React.useRef(undefined);

  React.useEffect(() => {
    const fg = fg3DRef.current;
    return () => {
      if (fg) {
        fg.renderer().dispose();
        fg.scene().clear();
      }
    };
  }, []);

  const router = useRouter();

  const [data, setData] = React.useState<GraphData | null>({
    nodes: [],
    links: [],
  });

  React.useEffect(() => {
    setData(showOutLinks ? graphData?.withOutLinks : graphData?.noOutLinks);
    setTimeout(() => {
      if (fg3DRef?.current) {
        try {
          fg3DRef.current.d3ReheatSimulation &&
            fg3DRef.current.d3ReheatSimulation();
          fg3DRef.current.zoomToFit && fg3DRef.current.zoomToFit(400);
        } catch (err) {
          // Ignore errors - simulation/zoom are optional
          void err;
        }
      }
    }, 100);
    console.debug(
      "Graph3D setData - showOutLinks=",
      showOutLinks,
      "nodes=",
      graphData?.withOutLinks?.nodes?.length,
      graphData?.noOutLinks?.nodes?.length
    );
  }, [graphData?.withOutLinks, graphData?.noOutLinks, showOutLinks]);

  // const data = graphData?.withOutLinks;

  const handleClick = (node: NodeObject) => {
    void router.push(`/kanji-graph/${encodeURIComponent(String(node?.id))}`);
  };

  // prefetch routes for nodes visible in the graph
  React.useEffect(() => {
    data?.nodes?.forEach((node) => {
      void router.prefetch(
        `/kanji-graph/${encodeURIComponent(String(node.id))}`
      );
    });
  }, [data, router]);

  React.useEffect(() => {
    const controls = fg3DRef?.current?.controls();
    if (controls) {
      // @ts-expect-error - controls type lacks autoRotate property in typing
      controls.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // FOCUS  ON MAIN NODE AT START
  React.useEffect(() => {
    const focusMain = setTimeout(() => {
      if (kanjiInfo.id && data && data?.nodes?.length > 0) {
        const node = data?.nodes?.find((o) => o.id === kanjiInfo.id);
        const distance = 160;
        if (
          node &&
          node?.x &&
          node?.y &&
          node?.z &&
          fg3DRef &&
          fg3DRef?.current
        ) {
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
          fg3DRef.current.cameraPosition(
            {
              x: node.x * distRatio,
              y: node.y * distRatio,
              z: node.z * distRatio,
            }, // new position
            { x: node.x, y: node.y, z: node.z }, // lookAt ({ x, y, z })
            1000 // ms transition duration
          );
        }
      }
    }, 100);

    return () => {
      clearTimeout(focusMain);
    };
  }, [data, kanjiInfo.id, triggerFocus]);

  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debounceResumeAutoRotate = debounce((node: any) => {
    if (autoRotate && fg3DRef?.current) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error - Link object typing is from external lib
      !node && (fg3DRef.current.controls().autoRotate = true);
    }
  }, 500);

  const handleHover = (node: any, prevNode: any) => {
    // Ensure autoRotate is paused on hover
    if (autoRotate && fg3DRef?.current) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error - Link object typing is from external lib
      node && (fg3DRef.current.controls().autoRotate = false);
      debounceResumeAutoRotate(node);
    }

    // Reset the previous node's color to its default
    if (prevNode) resetNodeColor(prevNode);

    // Apply hover effect to the currently hovered node
    if (node) highlightNode(node);
  };

  // Function to reset a node's color to its default
  const resetNodeColor = (node: any) => {
    const defaultColor = getNodeDefaultColor(node.id);
    if (node?.__threeObj?.children[1]?.material?.color) {
      node.__threeObj.children[1].material.color.set(defaultColor);
    }
  };

  // Function to highlight the currently hovered node
  const highlightNode = (node: any) => {
    if (node?.__threeObj?.children[1]?.material?.color) {
      // Slightly darken the node's current color for hover effect
      const color = node.__threeObj.children[1].material.color;
      node.__threeObj.children[1].material.color.setRGB(
        color.r * 0.8,
        color.g * 0.8,
        color.b * 0.8
      );
    }
  };

  // Get default node color based on its type
  const getNodeDefaultColor = (nodeId: string) => {
    if (nodeId === kanjiInfo.id) {
      return "#2B99CF"; // Main node
    } else if (joyoList.includes(String(nodeId))) {
      return "#80c2e2"; // Joyo kanji
    } else if (jinmeiyoList.includes(String(nodeId))) {
      return "#d5ebf5"; // Jinmeiyo kanji
    }
    return "#fff"; // Default
  };

  // find same onyomi
  const sameOn = (kanji1: string, kanji2: string) => {
    const k1 = data?.nodes?.find((o) => o?.id === kanji1) as NodeObjectWithData;
    const k2 = data?.nodes?.find((o) => o?.id === kanji2) as NodeObjectWithData;
    const on1: string[] = k1?.data?.jishoData?.onyomi;
    const on2: string[] = k2?.data?.jishoData?.onyomi;
    return on1?.filter((value) => on2?.includes(value)) ?? "";
  };

  if (!data) return <></>;

  return (
    <ForceGraph3D
      controlType={"orbit"}
      width={bounds.width}
      height={bounds.height}
      backgroundColor={"#00000000"}
      graphData={data}
      linkColor={() => {
        return resolvedTheme === "dark" ? "#ffffff" : "#000000";
      }}
      // Make link lines visible and set width/opactiy
      linkWidth={1.2}
      linkOpacity={0.9}
      linkMaterial={
        new THREE.LineBasicMaterial({
          color:
            resolvedTheme === "dark"
              ? new THREE.Color("#ffffff")
              : new THREE.Color("#000000"),
        })
      }
      // Deduped curvature is passed by the parent graphs.tsx
      linkCurvature={(l: any) => l?.curvature ?? 0}
      linkDirectionalArrowLength={5}
      linkDirectionalArrowRelPos={({ source, target }) => {
        if (
          typeof source === "object" &&
          typeof target === "object" &&
          source.x &&
          target.x &&
          source.y &&
          target.y &&
          source.z &&
          target.z
        ) {
          const linkLength = Math.hypot(
            target.x - source.x,
            target.y - source.y,
            target.z - source.z
          );
          const pos = (linkLength - 8) / linkLength;
          return Math.max(0.05, Math.min(0.95, pos));
        } else {
          return 0.8;
        }
      }}
      linkDirectionalArrowResolution={8}
      linkDirectionalParticles={showParticles ? 3 : 0}
      linkDirectionalParticleSpeed={0.004}
      linkDirectionalParticleWidth={showParticles ? 1 : 0}
      linkDirectionalParticleColor={() =>
        resolvedTheme === "dark" ? "#ffffff" : "#000000"
      }
      linkDirectionalParticleResolution={8}
      enableNavigationControls={true}
      showNavInfo={false}
      ref={fg3DRef}
      // warmupTicks={120}
      // cooldownTime={1500}
      onNodeClick={handleClick}
      onNodeHover={handleHover}
      nodeLabel={(n) => {
        const node = n as NodeObjectWithData;
        const kunyomiArr: string[] | undefined = node.data?.jishoData?.kunyomi;
        const kunyomi = Array.isArray(kunyomiArr)
          ? kunyomiArr.join(", ")
          : kunyomiArr || "";
        const meaning =
          node.data?.jishoData?.meaning || node.data?.meaning || "";
        return `<div style="color: #ffffff; background: #000000a6; padding: 4px; border-radius: 4px;">
                  <span>${kunyomi}</span>
                  <br/>
                  <span>${meaning}</span>
                </div>`;
      }}
      nodeThreeObject={(node: NodeObject) => {
        let color;
        // if it is he main node
        if (node.id === kanjiInfo.id) {
          color = colorPrimary;
        } else if (joyoList?.includes(String(node.id))) {
          color = colorPrimaryLight;
        } else if (jinmeiyoList?.includes(String(node.id))) {
          color = colorPrimaryLighter;
        } else {
          color = colorForeground;
        }

        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(8, 32, 32),
          new THREE.MeshLambertMaterial({
            color: color,
            transparent: true,
            depthWrite: false,
            opacity: 0.8,
          })
        );

        // If it's a single character
        const sprite = new SpriteText(String(node.id));
        sprite.fontFace =
          "Iowan Old Style, Apple Garamond, Baskerville, Times New Roman, Droid Serif, Times, Source Serif Pro, serif";
        sprite.color = colorForeground;
        sprite.textHeight = 10;
        sprite.fontSize = 120;
        sprite.padding = 3;

        const group = new THREE.Group();
        group.add(sprite);
        group.add(ball);
        return group;
      }}
      // ADD ONYOMI TO LINKS
      linkThreeObjectExtend={true}
      // @ts-expect-error - Link object typing is from external lib
      linkThreeObject={(link: LinkObject) => {
        const source =
          typeof link.source === "object" ? link.source.id : link.source;
        const target =
          typeof link.target === "object" ? link.target.id : link.target;

        const linkText = sameOn(String(source), String(target));

        let sprite: SpriteText;
        if (linkText && linkText.length > 0) {
          sprite = new SpriteText(linkText.join(", "));
        } else {
          return null;
        }
        sprite.color = cssVar(
          "--color-foreground",
          resolvedTheme === "dark" ? "#ffffff" : "#000000"
        );
        sprite.textHeight = 6;
        return sprite;
      }}
      linkPositionUpdate={(sprite, { start, end }) => {
        const middlePos: { x: number; y: number; z: number } = {
          x: start.x + (end.x - start.x) / 2,
          y: start.y + (end.y - start.y) / 2,
          z: start.z + (end.z - start.z) / 2,
        };
        // if there is a same onyomi link
        sprite?.position && Object.assign(sprite.position, middlePos);
        return null;
      }}
    />
  );
};

export default Graph3D;
