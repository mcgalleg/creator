import React from "react";
import { interpolate, spring, useVideoConfig, staticFile } from "remotion";
import { RoughGenerator } from "roughjs/bin/generator";
import type { PathInfo } from "roughjs/bin/core";
import { SPRING_PUNCH, SPRING_SMOOTH } from "./constants";

interface SimulatedCanvasProps {
  frame: number;
  enterFrame: number;
}

// ─── Excalidraw dark-mode palette ───

const EX = {
  bg: "#121212",
  gridDot: "#2a2a2a",
  stroke: "#e8e8e8",
  blue: "#a5d8ff",
  green: "#b2f2bb",
  orange: "#ffd8a8",
  purple: "#d0bfff",
  yellow: "#fff3bf",
  teal: "#c3fae8",
};

const CANVAS_W = 1248;
const CANVAS_H = 980;
const EDGE_DRAW_FRAMES = 14;

// ─── Roughjs generator (all shapes pre-computed at module level) ───

const gen = new RoughGenerator();

// ─── Node definitions ───

interface NodeDef {
  id: string;
  label: string;
  x: number; // center x
  y: number; // center y
  w: number;
  h: number;
  level: 0 | 1 | 2 | 3;
  fill: string;
  delay: number;
  seed: number;
}

// 16-node mind map with Excalidraw pastel fills
// Coordinates fit within the ~1248x980 visible area of the right panel
const NODES: NodeDef[] = [
  // Central hub (blue)
  { id: "root", label: "Content Strategy", x: 280, y: 460, w: 240, h: 72, level: 0, fill: EX.blue, delay: 0, seed: 1 },
  // Level 1 branches
  { id: "trending", label: "Trending Topics", x: 570, y: 170, w: 210, h: 58, level: 1, fill: EX.purple, delay: 12, seed: 10 },
  { id: "schedule", label: "Post Schedule", x: 570, y: 460, w: 195, h: 58, level: 1, fill: EX.orange, delay: 18, seed: 20 },
  { id: "audience", label: "Audience Growth", x: 570, y: 730, w: 215, h: 58, level: 1, fill: EX.green, delay: 24, seed: 30 },
  // Level 2 sub-topics
  { id: "hashtag", label: "Hashtag Analysis", x: 840, y: 100, w: 190, h: 50, level: 2, fill: EX.purple, delay: 34, seed: 40 },
  { id: "sounds", label: "Sound Trends", x: 840, y: 240, w: 170, h: 50, level: 2, fill: EX.purple, delay: 38, seed: 50 },
  { id: "peak", label: "Peak Hours", x: 840, y: 390, w: 155, h: 50, level: 2, fill: EX.orange, delay: 42, seed: 60 },
  { id: "freq", label: "Post Frequency", x: 840, y: 530, w: 180, h: 50, level: 2, fill: EX.orange, delay: 46, seed: 70 },
  { id: "demo", label: "Demographics", x: 840, y: 660, w: 170, h: 50, level: 2, fill: EX.green, delay: 50, seed: 80 },
  { id: "engage", label: "Engagement", x: 840, y: 800, w: 160, h: 50, level: 2, fill: EX.green, delay: 54, seed: 90 },
  // Level 3 metric badges
  { id: "viral", label: "#viral #fyp", x: 1080, y: 100, w: 140, h: 40, level: 3, fill: EX.purple, delay: 60, seed: 100 },
  { id: "rising", label: "Rising \u2191", x: 1080, y: 240, w: 120, h: 40, level: 3, fill: EX.purple, delay: 64, seed: 110 },
  { id: "times", label: "9AM \u00b7 6PM", x: 1080, y: 390, w: 130, h: 40, level: 3, fill: EX.orange, delay: 68, seed: 120 },
  { id: "3x", label: "3x / week", x: 1080, y: 530, w: 125, h: 40, level: 3, fill: EX.orange, delay: 72, seed: 130 },
  { id: "gen", label: "18-24 Gen Z", x: 1080, y: 660, w: 145, h: 40, level: 3, fill: EX.green, delay: 76, seed: 140 },
  { id: "rate", label: "4.2% avg", x: 1080, y: 800, w: 125, h: 40, level: 3, fill: EX.green, delay: 80, seed: 150 },
];

const nodeMap = new Map(NODES.map((n) => [n.id, n]));

// ─── Edge definitions ───

interface EdgeDef {
  from: string;
  to: string;
  delay: number;
  seed: number;
}

const EDGES: EdgeDef[] = [
  // L0 -> L1
  { from: "root", to: "trending", delay: 6, seed: 200 },
  { from: "root", to: "schedule", delay: 12, seed: 201 },
  { from: "root", to: "audience", delay: 18, seed: 202 },
  // L1 -> L2
  { from: "trending", to: "hashtag", delay: 28, seed: 210 },
  { from: "trending", to: "sounds", delay: 32, seed: 211 },
  { from: "schedule", to: "peak", delay: 36, seed: 220 },
  { from: "schedule", to: "freq", delay: 40, seed: 221 },
  { from: "audience", to: "demo", delay: 44, seed: 230 },
  { from: "audience", to: "engage", delay: 48, seed: 231 },
  // L2 -> L3
  { from: "hashtag", to: "viral", delay: 56, seed: 240 },
  { from: "sounds", to: "rising", delay: 60, seed: 241 },
  { from: "peak", to: "times", delay: 64, seed: 250 },
  { from: "freq", to: "3x", delay: 68, seed: 251 },
  { from: "demo", to: "gen", delay: 72, seed: 260 },
  { from: "engage", to: "rate", delay: 76, seed: 261 },
];

// ─── Pre-compute all rough shapes (static, deterministic via seed) ───

interface RoughNode {
  paths: PathInfo[];
  node: NodeDef;
}

interface RoughEdge {
  linePaths: PathInfo[];
  arrowPaths: PathInfo[];
  edge: EdgeDef;
  fromX: number;
  toX: number;
  minY: number;
  maxY: number;
}

const roughNodes: RoughNode[] = NODES.map((node) => {
  const left = node.x - node.w / 2;
  const top = node.y - node.h / 2;

  const drawable = gen.rectangle(left, top, node.w, node.h, {
    roughness: node.level === 0 ? 1 : node.level === 3 ? 0.6 : 0.8,
    stroke: EX.stroke,
    strokeWidth: node.level === 0 ? 2 : 1.5,
    fill: node.fill,
    fillStyle: "solid",
    seed: node.seed,
    bowing: 1,
  });

  return { paths: gen.toPaths(drawable), node };
});

const roughEdges: RoughEdge[] = EDGES.map((edge) => {
  const from = nodeMap.get(edge.from)!;
  const to = nodeMap.get(edge.to)!;

  // Arrow from right edge of source to left edge of target
  const x1 = from.x + from.w / 2;
  const y1 = from.y;
  const x2 = to.x - to.w / 2;
  const y2 = to.y;

  const line = gen.line(x1, y1, x2, y2, {
    roughness: 0.8,
    stroke: EX.stroke,
    strokeWidth: 1.5,
    seed: edge.seed,
    bowing: 1,
  });

  // Arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 14;
  const headAngle = Math.PI / 6;

  const ah1 = gen.line(
    x2,
    y2,
    x2 - headLen * Math.cos(angle - headAngle),
    y2 - headLen * Math.sin(angle - headAngle),
    { roughness: 0.5, stroke: EX.stroke, strokeWidth: 1.5, seed: edge.seed + 1000 },
  );
  const ah2 = gen.line(
    x2,
    y2,
    x2 - headLen * Math.cos(angle + headAngle),
    y2 - headLen * Math.sin(angle + headAngle),
    { roughness: 0.5, stroke: EX.stroke, strokeWidth: 1.5, seed: edge.seed + 2000 },
  );

  return {
    linePaths: gen.toPaths(line),
    arrowPaths: [...gen.toPaths(ah1), ...gen.toPaths(ah2)],
    edge,
    fromX: x1,
    toX: x2,
    minY: Math.min(y1, y2),
    maxY: Math.max(y1, y2),
  };
});

// ─── Dot grid (Excalidraw style) ───

const DOT_GAP = 20;
const dots: { cx: number; cy: number }[] = [];
for (let y = DOT_GAP; y < CANVAS_H; y += DOT_GAP) {
  for (let x = DOT_GAP; x < CANVAS_W; x += DOT_GAP) {
    dots.push({ cx: x, cy: y });
  }
}

// ─── Component ───

export const SimulatedCanvas: React.FC<SimulatedCanvasProps> = ({
  frame,
  enterFrame,
}) => {
  const { fps } = useVideoConfig();
  const f = frame - enterFrame;

  const virgilUrl = staticFile("fonts/Virgil.woff2");

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1920,
        height: 1080,
        backgroundColor: EX.bg,
        overflow: "hidden",
      }}
    >
      {/* Load Virgil (Excalidraw's hand-drawn font) */}
      <style>{`
        @font-face {
          font-family: 'Virgil';
          src: url('${virgilUrl}') format('woff2');
          font-weight: normal;
          font-style: normal;
        }
      `}</style>

      <svg
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {/* ── Dot grid background ── */}
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={1} fill={EX.gridDot} />
        ))}

        {/* ── Clip-path defs for edge draw-in ── */}
        <defs>
          {roughEdges.map((re, i) => {
            const clipWidth = interpolate(
              f,
              [re.edge.delay, re.edge.delay + EDGE_DRAW_FRAMES],
              [0, re.toX - re.fromX + 40],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            return (
              <clipPath key={i} id={`edge-clip-${i}`}>
                <rect
                  x={re.fromX - 10}
                  y={re.minY - 60}
                  width={clipWidth}
                  height={re.maxY - re.minY + 120}
                />
              </clipPath>
            );
          })}
        </defs>

        {/* ── Connecting edges (clip-path draw-in + arrowheads) ── */}
        {roughEdges.map((re, i) => {
          const opacity = interpolate(
            f,
            [re.edge.delay, re.edge.delay + 5],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const arrowOpacity = interpolate(
            f,
            [re.edge.delay + 10, re.edge.delay + EDGE_DRAW_FRAMES],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          return (
            <g key={`edge-${i}`}>
              {/* Line with progressive reveal */}
              <g opacity={opacity} clipPath={`url(#edge-clip-${i})`}>
                {re.linePaths.map((p, j) => (
                  <path
                    key={j}
                    d={p.d}
                    stroke={p.stroke}
                    strokeWidth={p.strokeWidth}
                    fill={p.fill || "none"}
                  />
                ))}
              </g>
              {/* Arrowhead (appears near end of draw-in) */}
              <g opacity={arrowOpacity}>
                {re.arrowPaths.map((p, j) => (
                  <path
                    key={j}
                    d={p.d}
                    stroke={p.stroke}
                    strokeWidth={p.strokeWidth}
                    fill="none"
                  />
                ))}
              </g>
            </g>
          );
        })}

        {/* ── Nodes (rough rectangles + Virgil text) ── */}
        {roughNodes.map((rn) => {
          if (f < rn.node.delay) return null;

          const nodeOpacity = interpolate(
            f,
            [rn.node.delay, rn.node.delay + 10],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          const springConfig =
            rn.node.level <= 1 ? SPRING_PUNCH : SPRING_SMOOTH;
          const nodeSpring = spring({
            frame: f - rn.node.delay,
            fps,
            config: springConfig,
            durationInFrames: 18,
          });
          const scaleFrom = rn.node.level === 3 ? 0.5 : 0.7;
          const nodeScale = interpolate(nodeSpring, [0, 1], [scaleFrom, 1.0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const fontSize = [24, 20, 18, 16][rn.node.level];

          return (
            <g
              key={rn.node.id}
              opacity={nodeOpacity}
              transform={`translate(${rn.node.x}, ${rn.node.y}) scale(${nodeScale}) translate(${-rn.node.x}, ${-rn.node.y})`}
            >
              {/* Rough shape (hachure fill + hand-drawn stroke) */}
              {rn.paths.map((p, j) => (
                <path
                  key={j}
                  d={p.d}
                  stroke={p.stroke}
                  strokeWidth={p.strokeWidth}
                  fill={p.fill || "none"}
                />
              ))}
              {/* Label in Virgil font — dark text on pastel fills for contrast */}
              <text
                x={rn.node.x}
                y={rn.node.y + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Virgil, Segoe Print, Comic Sans MS, cursive"
                fontSize={fontSize}
                fontWeight={600}
                fill="#1e1e1e"
              >
                {rn.node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
