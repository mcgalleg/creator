"use client";

import React, { useRef, useState, useCallback } from "react";
import { RoughGenerator } from "roughjs/bin/generator";
import type { PathInfo } from "roughjs/bin/core";

// ─── Palette ───

const COLORS = {
  blue: "#a5d8ff",
  green: "#b2f2bb",
  orange: "#ffd8a8",
  purple: "#d0bfff",
  yellow: "#fff3bf",
  teal: "#c3fae8",
};

// ─── Canvas dimensions ───

const W = 580;
const H = 300;
const DOT_GAP = 20;

// ─── Node definitions ───

interface NodeDef {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  seed: number;
}

const INITIAL_NODES: NodeDef[] = [
  {
    id: "plan",
    label: "Growth Plan",
    x: 290,
    y: 150,
    w: 150,
    h: 48,
    fill: COLORS.blue,
    seed: 50,
  },
  {
    id: "hooks",
    label: "Viral Hooks",
    x: 100,
    y: 60,
    w: 130,
    h: 40,
    fill: COLORS.yellow,
    seed: 51,
  },
  {
    id: "times",
    label: "Best Times",
    x: 480,
    y: 60,
    w: 120,
    h: 40,
    fill: COLORS.orange,
    seed: 52,
  },
  {
    id: "pillars",
    label: "Content Pillars",
    x: 100,
    y: 240,
    w: 145,
    h: 40,
    fill: COLORS.teal,
    seed: 53,
  },
  {
    id: "collabs",
    label: "Collab Ideas",
    x: 480,
    y: 240,
    w: 130,
    h: 40,
    fill: COLORS.green,
    seed: 54,
  },
];

// ─── Edge definitions ───

interface EdgeDef {
  from: string;
  to: string;
  seed: number;
}

const EDGES: EdgeDef[] = [
  { from: "plan", to: "hooks", seed: 300 },
  { from: "plan", to: "times", seed: 301 },
  { from: "plan", to: "pillars", seed: 302 },
  { from: "plan", to: "collabs", seed: 303 },
];

// ─── Rough.js helpers ───

const gen = new RoughGenerator();

interface RoughEdge {
  linePaths: PathInfo[];
  arrowPaths: PathInfo[];
}

function computeNodePaths(node: NodeDef): PathInfo[] {
  const left = node.x - node.w / 2;
  const top = node.y - node.h / 2;
  const drawable = gen.rectangle(left, top, node.w, node.h, {
    roughness: 0.8,
    stroke: "var(--rough-stroke)",
    strokeWidth: 1.5,
    fill: node.fill,
    fillStyle: "solid",
    seed: node.seed,
    bowing: 1,
  });
  return gen.toPaths(drawable);
}

/** Point on the node border closest to a target point */
function borderPoint(node: NodeDef, tx: number, ty: number) {
  const dx = tx - node.x;
  const dy = ty - node.y;
  if (dx === 0 && dy === 0) return { x: node.x, y: node.y };
  const scaleX = dx !== 0 ? (node.w / 2) / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? (node.h / 2) / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return { x: node.x + dx * scale, y: node.y + dy * scale };
}

function computeEdgePaths(
  fromNode: NodeDef,
  toNode: NodeDef,
  seed: number
): { linePaths: PathInfo[]; arrowPaths: PathInfo[] } {
  const p1 = borderPoint(fromNode, toNode.x, toNode.y);
  const p2 = borderPoint(toNode, fromNode.x, fromNode.y);

  const line = gen.line(p1.x, p1.y, p2.x, p2.y, {
    roughness: 0.8,
    stroke: "var(--rough-stroke)",
    strokeWidth: 1.5,
    seed,
    bowing: 1,
  });

  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const headLen = 10;
  const headAngle = Math.PI / 6;

  const ah1 = gen.line(
    p2.x,
    p2.y,
    p2.x - headLen * Math.cos(angle - headAngle),
    p2.y - headLen * Math.sin(angle - headAngle),
    { roughness: 0.5, stroke: "var(--rough-stroke)", strokeWidth: 1.5, seed: seed + 1000 }
  );
  const ah2 = gen.line(
    p2.x,
    p2.y,
    p2.x - headLen * Math.cos(angle + headAngle),
    p2.y - headLen * Math.sin(angle + headAngle),
    { roughness: 0.5, stroke: "var(--rough-stroke)", strokeWidth: 1.5, seed: seed + 2000 }
  );

  return {
    linePaths: gen.toPaths(line),
    arrowPaths: [...gen.toPaths(ah1), ...gen.toPaths(ah2)],
  };
}

// Pre-compute initial shapes
const initialNodePaths = new Map(
  INITIAL_NODES.map((node) => [node.id, computeNodePaths(node)])
);

// Dot grid
const dots: { cx: number; cy: number }[] = [];
for (let y = DOT_GAP; y < H; y += DOT_GAP) {
  for (let x = DOT_GAP; x < W; x += DOT_GAP) {
    dots.push({ cx: x, cy: y });
  }
}

// ─── Component ───

export function CanvasShowcaseInteractiveMockup() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodePositions, setNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    for (const n of INITIAL_NODES) {
      pos[n.id] = { x: n.x, y: n.y };
    }
    return pos;
  });

  const [hasDragged, setHasDragged] = useState(false);

  const dragging = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) * W) / rect.width,
      y: ((clientY - rect.top) * H) / rect.height,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      const svgPoint = clientToSvg(e.clientX, e.clientY);
      dragging.current = {
        id: nodeId,
        startX: svgPoint.x,
        startY: svgPoint.y,
        origX: nodePositions[nodeId].x,
        origY: nodePositions[nodeId].y,
      };
      if (!hasDragged) setHasDragged(true);
    },
    [nodePositions, clientToSvg, hasDragged]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragging.current;
      if (!drag) return;
      const svgPoint = clientToSvg(e.clientX, e.clientY);
      const dx = svgPoint.x - drag.startX;
      const dy = svgPoint.y - drag.startY;
      const id = drag.id;
      const newX = drag.origX + dx;
      const newY = drag.origY + dy;
      setNodePositions((prev) => ({
        ...prev,
        [id]: { x: newX, y: newY },
      }));
    },
    [clientToSvg]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  // Current nodes with live positions
  const currentNodes: NodeDef[] = INITIAL_NODES.map((n) => ({
    ...n,
    x: nodePositions[n.id]?.x ?? n.x,
    y: nodePositions[n.id]?.y ?? n.y,
  }));

  const nodeMap = new Map(currentNodes.map((n) => [n.id, n]));

  const currentEdges: RoughEdge[] = EDGES.map((edge) => {
    const from = nodeMap.get(edge.from)!;
    const to = nodeMap.get(edge.to)!;
    return computeEdgePaths(from, to, edge.seed);
  });

  return (
    <div
      className="rounded-xl border bg-card shadow-sm overflow-hidden select-none"
      style={{ "--rough-stroke": "var(--foreground)" } as React.CSSProperties}
    >
      <style>{`
        @font-face {
          font-family: 'Virgil';
          src: url('/fonts/Virgil.woff2') format('woff2');
          font-display: swap;
        }
      `}</style>

      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-red-400/60" />
          <div className="size-2.5 rounded-full bg-yellow-400/60" />
          <div className="size-2.5 rounded-full bg-green-400/60" />
        </div>
        <div className="text-xs text-muted-foreground ml-2">Canvas</div>
        <div className="ml-auto flex items-center gap-1">
          {["□", "○", "—", "A", "✎"].map((t) => (
            <div
              key={t}
              className="size-5 rounded bg-muted flex items-center justify-center text-[9px] text-muted-foreground"
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive SVG canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none", minHeight: 220 }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Dot grid */}
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={0.8} className="fill-border" />
        ))}

        {/* Edges */}
        {currentEdges.map((re, i) => (
          <g key={`edge-${i}`} className="opacity-80">
            {re.linePaths.map((p, j) => (
              <path
                key={j}
                d={p.d}
                stroke={p.stroke}
                strokeWidth={p.strokeWidth}
                fill="none"
              />
            ))}
            {re.arrowPaths.map((p, j) => (
              <path
                key={`ah-${j}`}
                d={p.d}
                stroke={p.stroke}
                strokeWidth={p.strokeWidth}
                fill="none"
              />
            ))}
          </g>
        ))}

        {/* Nodes */}
        {currentNodes.map((node) => {
          const hasMoved =
            node.x !== INITIAL_NODES.find((n) => n.id === node.id)!.x ||
            node.y !== INITIAL_NODES.find((n) => n.id === node.id)!.y;

          const paths = hasMoved
            ? computeNodePaths(node)
            : initialNodePaths.get(node.id)!;

          return (
            <g
              key={node.id}
              onPointerDown={(e) => handlePointerDown(e, node.id)}
              style={{ cursor: "grab" }}
            >
              <rect
                x={node.x - node.w / 2 - 4}
                y={node.y - node.h / 2 - 4}
                width={node.w + 8}
                height={node.h + 8}
                fill="transparent"
              />
              {paths.map((p, j) => (
                <path
                  key={j}
                  d={p.d}
                  stroke={p.stroke}
                  strokeWidth={p.strokeWidth}
                  fill={p.fill || "none"}
                />
              ))}
              <text
                x={node.x}
                y={node.y + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Virgil, Segoe Print, Comic Sans MS, cursive"
                fontSize={node.id === "plan" ? 16 : 13}
                fontWeight={600}
                fill="#1e1e1e"
                style={{ pointerEvents: "none" }}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Drag hint */}
        {!hasDragged && (
          <text
            x={W / 2}
            y={H - 12}
            textAnchor="middle"
            fontSize={11}
            className="fill-muted-foreground animate-pulse"
            style={{ pointerEvents: "none" }}
          >
            drag the shapes around
          </text>
        )}
      </svg>
    </div>
  );
}
