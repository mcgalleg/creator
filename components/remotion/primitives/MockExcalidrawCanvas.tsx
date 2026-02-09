"use client";

import React from "react";
import { interpolate } from "remotion";
import { evolvePath } from "@remotion/paths";
import { FONT_SANS } from "../constants";

type ExcalidrawElement =
  | { type: "rect"; x: number; y: number; w: number; h: number; label: string; fill: string }
  | { type: "diamond"; x: number; y: number; w: number; h: number; label: string; fill: string }
  | { type: "arrow"; x1: number; y1: number; x2: number; y2: number; label?: string };

interface MockExcalidrawCanvasProps {
  elements: ExcalidrawElement[];
  visibleUpTo?: number;
  drawProgress?: number;
}

const seededRandom = (seed: number) => ((seed * 9301 + 49297) % 233280) / 233280;

// Generate a wobbly rect path with seeded offsets
function wobblyRect(x: number, y: number, w: number, h: number, seed: number): string {
  const wobble = (s: number) => (seededRandom(s) - 0.5) * 4;
  const tl = { x: x + wobble(seed), y: y + wobble(seed + 1) };
  const tr = { x: x + w + wobble(seed + 2), y: y + wobble(seed + 3) };
  const br = { x: x + w + wobble(seed + 4), y: y + h + wobble(seed + 5) };
  const bl = { x: x + wobble(seed + 6), y: y + h + wobble(seed + 7) };
  return `M ${tl.x},${tl.y} L ${tr.x},${tr.y} L ${br.x},${br.y} L ${bl.x},${bl.y} Z`;
}

// Generate a wobbly diamond path
function wobblyDiamond(x: number, y: number, w: number, h: number, seed: number): string {
  const wobble = (s: number) => (seededRandom(s) - 0.5) * 3;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const top = { x: cx + wobble(seed), y: y + wobble(seed + 1) };
  const right = { x: x + w + wobble(seed + 2), y: cy + wobble(seed + 3) };
  const bottom = { x: cx + wobble(seed + 4), y: y + h + wobble(seed + 5) };
  const left = { x: x + wobble(seed + 6), y: cy + wobble(seed + 7) };
  return `M ${top.x},${top.y} L ${right.x},${right.y} L ${bottom.x},${bottom.y} L ${left.x},${left.y} Z`;
}

// Arrow path with slight curve
function arrowPath(x1: number, y1: number, x2: number, y2: number, seed: number): string {
  const midX = (x1 + x2) / 2 + (seededRandom(seed) - 0.5) * 20;
  const midY = (y1 + y2) / 2 + (seededRandom(seed + 1) - 0.5) * 20;
  return `M ${x1},${y1} Q ${midX},${midY} ${x2},${y2}`;
}

// Arrowhead path
function arrowHead(x1: number, y1: number, x2: number, y2: number): string {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 10;
  const a1 = angle + Math.PI * 0.8;
  const a2 = angle - Math.PI * 0.8;
  const hx1 = x2 + headLen * Math.cos(a1);
  const hy1 = y2 + headLen * Math.sin(a1);
  const hx2 = x2 + headLen * Math.cos(a2);
  const hy2 = y2 + headLen * Math.sin(a2);
  return `M ${hx1},${hy1} L ${x2},${y2} L ${hx2},${hy2}`;
}

// Make fill semi-transparent
function semiTransparent(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const MockExcalidrawCanvas: React.FC<MockExcalidrawCanvasProps> = ({
  elements,
  visibleUpTo = elements.length - 1,
  drawProgress = 1,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#FFFFFF",
        borderRadius: 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid dots */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="gridDots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="#e0e0e0" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gridDots)" />
      </svg>

      {/* Elements */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        viewBox="0 0 660 440"
      >
        {elements.map((el, i) => {
          if (i > visibleUpTo) return null;

          const isCurrentlyDrawing = i === visibleUpTo;
          const progress = isCurrentlyDrawing ? drawProgress : 1;

          if (el.type === "rect") {
            const path = wobblyRect(el.x, el.y, el.w, el.h, i * 10);
            const evolved = evolvePath(progress, path);
            return (
              <g key={i}>
                {progress >= 0.5 && (
                  <path
                    d={path}
                    fill={semiTransparent(el.fill, 0.15)}
                    stroke="none"
                    opacity={interpolate(progress, [0.5, 0.8], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    })}
                  />
                )}
                <path
                  d={path}
                  fill="none"
                  stroke="#333"
                  strokeWidth={2}
                  strokeDasharray={evolved.strokeDasharray}
                  strokeDashoffset={evolved.strokeDashoffset}
                />
                {progress >= 1 && (
                  <text
                    x={el.x + el.w / 2}
                    y={el.y + el.h / 2 + 4}
                    textAnchor="middle"
                    fontSize={12}
                    fontFamily={FONT_SANS}
                    fill="#333"
                  >
                    {el.label}
                  </text>
                )}
              </g>
            );
          }

          if (el.type === "diamond") {
            const path = wobblyDiamond(el.x, el.y, el.w, el.h, i * 10 + 100);
            const evolved = evolvePath(progress, path);
            return (
              <g key={i}>
                {progress >= 0.5 && (
                  <path
                    d={path}
                    fill={semiTransparent(el.fill, 0.15)}
                    stroke="none"
                    opacity={interpolate(progress, [0.5, 0.8], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    })}
                  />
                )}
                <path
                  d={path}
                  fill="none"
                  stroke="#333"
                  strokeWidth={2}
                  strokeDasharray={evolved.strokeDasharray}
                  strokeDashoffset={evolved.strokeDashoffset}
                />
                {progress >= 1 && (
                  <text
                    x={el.x + el.w / 2}
                    y={el.y + el.h / 2 + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontFamily={FONT_SANS}
                    fill="#333"
                  >
                    {el.label}
                  </text>
                )}
              </g>
            );
          }

          if (el.type === "arrow") {
            const path = arrowPath(el.x1, el.y1, el.x2, el.y2, i * 10 + 200);
            const head = arrowHead(el.x1, el.y1, el.x2, el.y2);
            const evolved = evolvePath(progress, path);
            return (
              <g key={i}>
                <path
                  d={path}
                  fill="none"
                  stroke="#333"
                  strokeWidth={2}
                  strokeDasharray={evolved.strokeDasharray}
                  strokeDashoffset={evolved.strokeDashoffset}
                />
                {progress >= 0.9 && (
                  <path
                    d={head}
                    fill="none"
                    stroke="#333"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {el.label && progress >= 1 && (
                  <text
                    x={(el.x1 + el.x2) / 2 + 8}
                    y={(el.y1 + el.y2) / 2 - 4}
                    fontSize={10}
                    fontFamily={FONT_SANS}
                    fill="#666"
                  >
                    {el.label}
                  </text>
                )}
              </g>
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
};
