import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { DARK, SPRING_PUNCH, SPRING_SMOOTH } from "./constants";

interface SimulatedCanvasProps {
  frame: number;
  enterFrame: number;
}

// ─── Node definition ───

interface NodeDef {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  level: 0 | 1 | 2 | 3;
  color: string;
  delay: number;
}

// 16-node mind map: central hub → 3 branches → 6 sub-topics → 6 metric badges
// Coordinates fit within the ~1248×980 visible area of the right panel

const NODES: NodeDef[] = [
  // Central hub
  { id: "root", label: "Content Strategy", x: 260, y: 440, w: 210, h: 56, level: 0, color: DARK.chart1, delay: 0 },
  // Level 1: Main branches
  { id: "trending", label: "Trending Topics", x: 545, y: 160, w: 180, h: 46, level: 1, color: DARK.chart2, delay: 12 },
  { id: "schedule", label: "Post Schedule", x: 545, y: 440, w: 170, h: 46, level: 1, color: DARK.chart3, delay: 18 },
  { id: "audience", label: "Audience Growth", x: 545, y: 720, w: 185, h: 46, level: 1, color: DARK.chart4, delay: 24 },
  // Level 2: Sub-topics
  { id: "hashtag", label: "Hashtag Analysis", x: 810, y: 95, w: 165, h: 40, level: 2, color: DARK.chart2, delay: 34 },
  { id: "sounds", label: "Sound Trends", x: 810, y: 225, w: 148, h: 40, level: 2, color: DARK.chart2, delay: 38 },
  { id: "peak", label: "Peak Hours", x: 810, y: 375, w: 136, h: 40, level: 2, color: DARK.chart3, delay: 42 },
  { id: "freq", label: "Post Frequency", x: 810, y: 505, w: 158, h: 40, level: 2, color: DARK.chart3, delay: 46 },
  { id: "demo", label: "Demographics", x: 810, y: 655, w: 152, h: 40, level: 2, color: DARK.chart4, delay: 50 },
  { id: "engage", label: "Engagement", x: 810, y: 785, w: 140, h: 40, level: 2, color: DARK.chart4, delay: 54 },
  // Level 3: Metric badges
  { id: "viral", label: "#viral #fyp", x: 1050, y: 95, w: 114, h: 30, level: 3, color: DARK.chart2, delay: 60 },
  { id: "rising", label: "Rising \u2191", x: 1050, y: 225, w: 96, h: 30, level: 3, color: DARK.chart2, delay: 64 },
  { id: "times", label: "9AM \u00b7 6PM", x: 1050, y: 375, w: 112, h: 30, level: 3, color: DARK.chart3, delay: 68 },
  { id: "3x", label: "3x / week", x: 1050, y: 505, w: 108, h: 30, level: 3, color: DARK.chart3, delay: 72 },
  { id: "gen", label: "18-24 Gen Z", x: 1050, y: 655, w: 125, h: 30, level: 3, color: DARK.chart4, delay: 76 },
  { id: "rate", label: "4.2% avg", x: 1050, y: 785, w: 105, h: 30, level: 3, color: DARK.chart4, delay: 80 },
];

const nodeMap = new Map(NODES.map((n) => [n.id, n]));

// ─── Edge definitions (15 connections) ───

interface EdgeDef {
  from: string;
  to: string;
  color: string;
  delay: number;
}

const EDGES: EdgeDef[] = [
  // L0 → L1
  { from: "root", to: "trending", color: DARK.chart2, delay: 6 },
  { from: "root", to: "schedule", color: DARK.chart3, delay: 12 },
  { from: "root", to: "audience", color: DARK.chart4, delay: 18 },
  // L1 → L2
  { from: "trending", to: "hashtag", color: DARK.chart2, delay: 28 },
  { from: "trending", to: "sounds", color: DARK.chart2, delay: 32 },
  { from: "schedule", to: "peak", color: DARK.chart3, delay: 36 },
  { from: "schedule", to: "freq", color: DARK.chart3, delay: 40 },
  { from: "audience", to: "demo", color: DARK.chart4, delay: 44 },
  { from: "audience", to: "engage", color: DARK.chart4, delay: 48 },
  // L2 → L3
  { from: "hashtag", to: "viral", color: DARK.chart2, delay: 56 },
  { from: "sounds", to: "rising", color: DARK.chart2, delay: 60 },
  { from: "peak", to: "times", color: DARK.chart3, delay: 64 },
  { from: "freq", to: "3x", color: DARK.chart3, delay: 68 },
  { from: "demo", to: "gen", color: DARK.chart4, delay: 72 },
  { from: "engage", to: "rate", color: DARK.chart4, delay: 76 },
];

// ─── Precompute SVG paths (quadratic bezier from right edge → left edge) ───

const PATH_LENGTH = 350;
const EDGE_DRAW_FRAMES = 14;

function computeEdgePath(edge: EdgeDef): string {
  const from = nodeMap.get(edge.from)!;
  const to = nodeMap.get(edge.to)!;
  const x1 = from.x + from.w / 2;
  const y1 = from.y;
  const x2 = to.x - to.w / 2;
  const y2 = to.y;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

const edgePaths = EDGES.map(computeEdgePath);

// ─── Dot grid background ───

const DOT_SPACING = 48;
const GRID_W = 1248;
const GRID_H = 980;
const dotGrid: { cx: number; cy: number }[] = [];
for (let row = 0; row < Math.ceil(GRID_H / DOT_SPACING); row++) {
  for (let col = 0; col < Math.ceil(GRID_W / DOT_SPACING); col++) {
    dotGrid.push({
      cx: col * DOT_SPACING + DOT_SPACING / 2,
      cy: row * DOT_SPACING + DOT_SPACING / 2,
    });
  }
}

// ─── Component ───

export const SimulatedCanvas: React.FC<SimulatedCanvasProps> = ({
  frame,
  enterFrame,
}) => {
  const { fps } = useVideoConfig();
  const f = frame - enterFrame;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1920,
        height: 1080,
        backgroundColor: DARK.bg,
        overflow: "hidden",
      }}
    >
      {/* ── Dot grid ── */}
      <svg
        width={GRID_W}
        height={GRID_H}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {dotGrid.map((dot, i) => (
          <circle key={i} cx={dot.cx} cy={dot.cy} r={1} fill={DARK.border} />
        ))}
      </svg>

      {/* ── Central node glow ── */}
      <div
        style={{
          position: "absolute",
          left: 260 - 120,
          top: 440 - 90,
          width: 240,
          height: 180,
          background: `radial-gradient(ellipse at center, ${DARK.chart1}40 0%, transparent 70%)`,
          opacity: interpolate(f, [0, 15], [0, 0.7], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          pointerEvents: "none",
        }}
      />

      {/* ── Connecting edges (stroke-dashoffset draw-in) ── */}
      <svg
        width={GRID_W}
        height={GRID_H}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {EDGES.map((edge, i) => {
          const drawOffset = interpolate(
            f,
            [edge.delay, edge.delay + EDGE_DRAW_FRAMES],
            [PATH_LENGTH, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          const opacity = interpolate(
            f,
            [edge.delay, edge.delay + 5],
            [0, 0.7],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <path
              key={i}
              d={edgePaths[i]}
              fill="none"
              stroke={edge.color}
              strokeWidth={1.5}
              strokeDasharray={PATH_LENGTH}
              strokeDashoffset={drawOffset}
              opacity={opacity}
            />
          );
        })}
      </svg>

      {/* ── Nodes ── */}
      {NODES.map((node) => {
        if (f < node.delay) return null;

        const nodeOpacity = interpolate(
          f,
          [node.delay, node.delay + 10],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        const springConfig = node.level <= 1 ? SPRING_PUNCH : SPRING_SMOOTH;
        const nodeSpring = spring({
          frame: f - node.delay,
          fps,
          config: springConfig,
          durationInFrames: 18,
        });
        const scaleFrom = node.level === 3 ? 0.5 : 0.7;
        const nodeScale = interpolate(nodeSpring, [0, 1], [scaleFrom, 1.0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Level-specific styling
        let bg: string;
        let border: string;
        let textColor: string;
        let radius: number;
        let shadow: string;

        switch (node.level) {
          case 0:
            bg = node.color;
            border = "none";
            textColor = "#ffffff";
            radius = 14;
            shadow = `0 0 24px ${node.color}30`;
            break;
          case 1:
            bg = DARK.card;
            border = `1.5px solid ${node.color}`;
            textColor = DARK.foreground;
            radius = 10;
            shadow = `0 0 12px ${node.color}20`;
            break;
          case 2:
            bg = "rgba(45,45,45,0.8)";
            border = `1px solid ${node.color}60`;
            textColor = DARK.foreground;
            radius = 8;
            shadow = "none";
            break;
          default:
            bg = `${node.color}18`;
            border = `1px solid ${node.color}40`;
            textColor = node.color;
            radius = 15;
            shadow = "none";
            break;
        }

        const fontSize = [16, 14, 13, 11][node.level];
        const fontWeight = [700, 600, 500, 600][node.level];

        return (
          <div
            key={node.id}
            style={{
              position: "absolute",
              left: node.x,
              top: node.y,
              width: node.w,
              height: node.h,
              transform: `translate(-50%, -50%) scale(${nodeScale})`,
              opacity: nodeOpacity,
              backgroundColor: bg,
              border,
              borderRadius: radius,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: shadow,
            }}
          >
            <span
              style={{
                color: textColor,
                fontSize,
                fontWeight,
                fontFamily: "system-ui, -apple-system, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {node.label}
            </span>
          </div>
        );
      })}

      {/* ── Title label ── */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          fontSize: 11,
          color: DARK.mutedFg,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 500,
          letterSpacing: 1,
          textTransform: "uppercase",
          opacity: interpolate(f, [5, 20], [0, 0.5], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        AI-Generated Strategy Map
      </div>
    </div>
  );
};
