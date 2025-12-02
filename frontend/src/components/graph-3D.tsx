"use client";

import kanjilist from "@/../data/kanjilist.json";
import { rotateAtom } from "@/lib/store";
import { useThemeStore } from "@/store/themeStore";
import type { BothGraphData, KanjiInfo } from "@/types/kanji";
import { useAtom } from "jotai";
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
  showParticles: boolean;
}

export const dynamic = "force-dynamic";

const Graph3D: React.FC<Props> = ({
  kanjiInfo,
  graphData,
  showOutLinks,
  triggerFocus,
  bounds,
  showParticles,
}) => {
  // Note: do not early-return before hooks; guard in render instead.

  const joyoList = kanjilist.filter((el) => el.g === 1).map((el) => el.k);
  const jinmeiyoList = kanjilist.filter((el) => el.g === 2).map((el) => el.k);

  const isDark = useThemeStore((s) => s.isDark);
  const [autoRotate] = useAtom(rotateAtom);

  const fg3DRef: React.MutableRefObject<ForceGraphMethods | undefined> =
    React.useRef(undefined);

  // helper to read CSS variable with fallback
  const cssVar = (name: string, fallback = "") => {
    try {
      const v = getComputedStyle(document.body).getPropertyValue(name);
      const raw = (v || fallback).trim() || fallback;
      // If the variable is an RGB triple like "239 68 68" or "239, 68, 68",
      // convert it into a valid css rgb(...) string for canvas/three usage.
      if (
        raw &&
        !raw.startsWith("#") &&
        !/^rgba?\(/i.test(raw) &&
        /[0-9]/.test(raw)
      ) {
        // normalize commas/spaces
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

  const colorPrimary = cssVar("--color-primary-600", "#2B99CF");
  const colorPrimaryLight = cssVar("--color-primary-300", "#80c2e2");
  const colorPrimaryLighter = cssVar("--color-primary-100", "#d5ebf5");
  const colorForeground = cssVar("--color-foreground", "#000000");

  React.useEffect(() => {
    const ref = fg3DRef.current;
    return () => {
      if (ref) {
        try {
          ref.renderer().dispose();
          ref.scene().clear();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const router = useRouter();

  const [data, setData] = React.useState<GraphData | null>({
    nodes: [],
    links: [],
  });

  React.useEffect(() => {
    const newData = showOutLinks
      ? graphData?.withOutLinks
      : graphData?.noOutLinks;
    setData(newData);
    console.debug(
      "Graph3D setData - showOutLinks=",
      showOutLinks,
      "\nwithOutLinks nodes=",
      graphData?.withOutLinks?.nodes?.length,
      "\nnoOutLinks nodes=",
      graphData?.noOutLinks?.nodes?.length,
      "\nselected data nodes=",
      newData?.nodes?.length,
      "\nActual graphData keys:",
      graphData ? Object.keys(graphData) : "null"
    );
  }, [graphData, showOutLinks]);

  const handleClick = (node: NodeObject) => {
    void router.push(`/kanji-graph/${encodeURIComponent(String(node.id))}`);
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
    const controls = (fg3DRef.current?.controls?.() as any) || null;
    if (controls) {
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = autoRotate ? 1.0 : 0; // Visible rotation speed
      console.debug(
        "Graph3D autoRotate set to:",
        autoRotate,
        "speed:",
        controls.autoRotateSpeed
      );
    }
  }, [autoRotate]);

  // Ensure controls are configured after the graph is ready
  React.useEffect(() => {
    if (data && data.nodes && data.nodes.length > 0) {
      const controls = (fg3DRef.current?.controls?.() as any) || null;
      if (controls) {
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = autoRotate ? 1.0 : 0;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
      }
    }
  }, [data, autoRotate]);

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
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debounceResumeAutoRotate = debounce((node: any) => {
    if (autoRotate && fg3DRef?.current) {
      const controls = (fg3DRef.current.controls?.() as any) || null;
      if (!node && controls) controls.autoRotate = true;
    }
  }, 500);

  const handleHover = (node: any, prevNode: any) => {
    // Ensure autoRotate is paused on hover
    if (autoRotate && fg3DRef?.current) {
      const controls = (fg3DRef.current.controls?.() as any) || null;
      if (node && controls) controls.autoRotate = false;
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
      // Slightly darken or brighten the node's current color for hover effect
      const color = node.__threeObj.children[1].material.color;
      const factor = isDark ? 0.7 : 1.2; // Darken in dark mode, brighten in light mode
      node.__threeObj.children[1].material.color.setRGB(
        Math.min(color.r * factor, 1),
        Math.min(color.g * factor, 1),
        Math.min(color.b * factor, 1)
      );
    }
  };

  // Get default node color based on its type
  const getNodeDefaultColor = (nodeId: string) => {
    if (nodeId === kanjiInfo.id) {
      return colorPrimary; // Main node
    } else if (joyoList.includes(String(nodeId))) {
      return colorPrimaryLight; // Joyo kanji
    } else if (jinmeiyoList.includes(String(nodeId))) {
      return colorPrimaryLighter; // Jinmeiyo kanji
    }
    return colorForeground; // Default
  };

  // find same onyomi
  const sameOn = (kanji1: string, kanji2: string) => {
    const k1 = data?.nodes?.find((o) => o?.id === kanji1) as NodeObjectWithData;
    const k2 = data?.nodes?.find((o) => o?.id === kanji2) as NodeObjectWithData;
    const on1: string[] = k1?.data?.jishoData?.onyomi;
    const on2: string[] = k2?.data?.jishoData?.onyomi;
    return on1?.filter((value) => on2?.includes(value)) ?? "";
  };

  if (!data || !graphData || !kanjiInfo) return <></>;

  return (
    <ForceGraph3D
      controlType={"orbit"}
      width={bounds.width}
      height={bounds.height}
      backgroundColor={"#00000000"}
      graphData={data}
      linkColor={() =>
        cssVar("--color-foreground", isDark ? "#ffffff" : "#000000")
      }
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
          return (linkLength - 8) / linkLength;
        } else {
          return 0.8;
        }
      }}
      linkDirectionalArrowResolution={8}
      linkDirectionalParticles={3}
      linkDirectionalParticleSpeed={0.004}
      linkDirectionalParticleWidth={showParticles ? 1 : 0.001}
      linkDirectionalParticleColor={() =>
        cssVar("--color-primary-600", "#2B99CF")
      }
      linkDirectionalParticleResolution={8}
      enableNavigationControls={true}
      showNavInfo={false}
      ref={fg3DRef}
      onNodeClick={handleClick}
      onNodeHover={handleHover}
      nodeLabel={(n) => {
        const node = n as NodeObjectWithData;
        return `<div style="color: #ffffff; background: #000000a6; padding: 4px; border-radius: 4px;">
                  <span>${node.data.jishoData?.kunyomi}</span>
                  <br/>
                  <span>${node.data.jishoData?.meaning}</span>
                </div>
               `;
      }}
      nodeThreeObject={(node: NodeObject) => {
        let color;
        // if it is the main node
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
            opacity: isDark ? 0.8 : 0.3,
          })
        );

        // If it's a single character
        const sprite = new SpriteText(String(node.id));
        sprite.fontFace =
          "Iowan Old Style, Apple Garamond, Baskerville, Times New Roman, Droid Serif, Times, Source Serif Pro, serif";
        // Use contrasting text color based on node background brightness
        const textColor = isDark ? "#ffffff" : "#000000";
        sprite.color = textColor;
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
          return new THREE.Object3D();
        }
        sprite.color = cssVar(
          "--color-foreground",
          isDark ? "#ffffff" : "#000000"
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
