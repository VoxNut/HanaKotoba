/**
 * TextOverlay Component
 *
 * Displays text overlay on manga pages that appears on hover.
 * Matches Mokuro's exact implementation:
 * - Text hidden by default, shown on hover
 * - White background on hover
 * - Each line rendered as separate <p> element
 * - writing-mode: vertical-rl flows text top-to-bottom, columns right-to-left
 * - Font size scales proportionally to image display size
 */

import React from "react";
import { EnrichedTextBox } from "../../services/mangaApi";

interface TextOverlayProps {
  box: EnrichedTextBox;
  isHovered: boolean;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  /** Original image width from OCR (for font scaling) */
  originalImgWidth?: number;
  /** Current displayed image width (for font scaling) */
  displayedImgWidth?: number;
}

export function TextOverlay({
  box,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  originalImgWidth,
  displayedImgWidth,
}: TextOverlayProps) {
  // Get lines from box, fallback to splitting text
  const lines = box.lines && box.lines.length > 0 ? box.lines : [box.text];

  // Calculate font size based on box dimensions
  // For vertical text: height determines how tall each column can be
  // Width determines how many columns can fit
  // We want font to fit nicely within the box

  // If we have both original and displayed widths, scale the font
  // Otherwise, calculate a sensible font size from the box dimensions
  let fontSize: number;

  if (originalImgWidth && displayedImgWidth && originalImgWidth > 0) {
    // Scale the detected font size based on image resize ratio
    const fontScale = displayedImgWidth / originalImgWidth;
    const baseFontSize = Math.max(12, Math.min(32, box.font_size ?? 16));
    fontSize = baseFontSize * fontScale;
  } else {
    // Fallback: estimate font size from box dimensions
    // For vertical text, the box height should fit about (height% / line_height) characters
    // The box width determines number of columns
    // Use displayedImgWidth to calculate actual pixel dimensions
    const imgWidth = displayedImgWidth || 800; // Assume 800px if unknown
    const boxWidthPx = (box.width / 100) * imgWidth;
    const boxHeightPx = (box.height / 100) * (imgWidth * 1.4); // Approximate aspect ratio

    // For vertical text: font size should be about boxWidth / numColumns
    // Estimate 1-2 columns based on text length
    const numColumns = Math.max(1, Math.ceil(box.text.length / 20));
    const maxFontByWidth = boxWidthPx / numColumns / 1.2; // 1.2 for line spacing

    // Also constrain by height - each column should fit ~10-20 chars
    const maxFontByHeight = boxHeightPx / 15;

    // Use the smaller of the two, clamped to reasonable range
    fontSize = Math.max(
      10,
      Math.min(24, Math.min(maxFontByWidth, maxFontByHeight))
    );
  }

  // Debug: log font scaling values
  if (isHovered) {
    console.log("TextOverlay font scaling:", {
      originalImgWidth,
      displayedImgWidth,
      fontSize,
      boxWidth: box.width,
      boxHeight: box.height,
      boxFontSize: box.font_size,
    });
  }

  // Mokuro sets vertical in the block data
  const isVertical = box.vertical !== false;

  // Mokuro exact CSS from styles.css:
  // .textBox {
  //   display: var(--textBoxDisplay);
  //   position: absolute;
  //   padding: 0;
  //   line-height: 1.1em;
  //   font-size: 16pt;
  //   white-space: nowrap;
  //   border: 1px solid rgba(0,0,0,0);
  // }
  // .textBox:hover { background: rgb(255,255,255); z-index: 999; }
  // .textBox p { display: none; ... }
  // .textBox:hover p { display: table; }

  return (
    <div
      className={`textBox ${isHovered ? "hovered" : ""}`}
      style={{
        position: "absolute",
        left: `${box.x}%`,
        top: `${box.y}%`,
        // When not hovered, use original box size
        // When hovered, allow it to grow to fit content
        width: isHovered ? "auto" : `${box.width}%`,
        height: isHovered ? "auto" : `${box.height}%`,
        // Minimum size is the original box size
        minWidth: `${box.width}%`,
        minHeight: `${box.height}%`,
        padding: isHovered ? "2px" : 0,
        lineHeight: "1.1em",
        fontSize: `${fontSize}px`,
        whiteSpace: isVertical ? "normal" : "nowrap",
        border: "1px solid transparent",
        background: isHovered ? "rgb(255, 255, 255)" : "transparent",
        zIndex: isHovered ? 999 : 10,
        writingMode: isVertical ? "vertical-rl" : "horizontal-tb",
        cursor: "text",
        fontFamily: '"Noto Sans JP", "Meiryo", "MS Gothic", sans-serif',
        // Allow overflow when hovered to show all text
        overflow: isHovered ? "visible" : "hidden",
        boxSizing: "border-box",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
    >
      {lines.map((line, idx) => (
        <p
          key={idx}
          style={{
            // Mokuro: display:table on hover makes block-level element
            display: isHovered ? "table" : "none",
            // Remove white-space:nowrap to allow text to flow naturally in vertical mode
            // Text will wrap to multiple columns within the container width
            whiteSpace: "normal",
            letterSpacing: "0.1em",
            lineHeight: "1.1em",
            margin: 0,
            backgroundColor: "rgb(255, 255, 255)",
          }}
          className="select-text"
        >
          {line}
        </p>
      ))}
    </div>
  );
}

export default TextOverlay;
