"use client";

import React, { useRef, useState, useCallback } from "react";
import { RoughGenerator } from "roughjs/bin/generator";
import type { PathInfo } from "roughjs/bin/core";

// ─── Excalidraw-style palette (adapts via CSS vars) ───

const COLORS = {
  blue: "#a5d8ff",
  green: "#b2f2bb",
  orange: "#ffd8a8",
  purple: "#d0bfff",
  yellow: "#fff3bf",
  teal: "#c3fae8",
};

// ─── Canvas dimensions (internal SVG viewBox) ───

const CANVAS_W = 520;
const CANVAS_H = 280;
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
  // Central hub
  {
    id: "root",
    label: "Content Strategy",
    x: 140,
    y: 140,
    w: 170,
    h: 52,
    fill: COLORS.blue,
    seed: 1,
  },
  // Branches
  {
    id: "trending",
    label: "Trending Topics",
    x: 380,
    y: 50,
    w: 155,
    h: 42,
    fill: COLORS.purple,
    seed: 10,
  },
  {
    id: "schedule",
    label: "Post Schedule",
    x: 380,
    y: 140,
    w: 140,
    h: 42,
    fill: COLORS.orange,
    seed: 20,
  },
  {
    id: "audience",
    label: "Audience Growth",
    x: 380,
    y: 230,
    w: 155,
    h: 42,
    fill: COLORS.green,
    seed: 30,
  },
];

// ─── Edge definitions ───

interface EdgeDef {
  from: string;
  to: string;
  seed: number;
}

const EDGES: EdgeDef[] = [
  { from: "root", to: "trending", seed: 200 },
  { from: "root", to: "schedule", seed: 201 },
  { from: "root", to: "audience", seed: 202 },
];

// ─── Pre-compute rough shapes ───

const gen = new RoughGenerator();

interface RoughNode {
  paths: PathInfo[];
  node: NodeDef;
}

interface RoughEdge {
  linePaths: PathInfo[];
  arrowPaths: PathInfo[];
  fromId: string;
  toId: string;
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

function computeEdgePaths(
  fromNode: NodeDef,
  toNode: NodeDef,
  seed: number
): { linePaths: PathInfo[]; arrowPaths: PathInfo[] } {
  const x1 = fromNode.x + fromNode.w / 2;
  const y1 = fromNode.y;
  const x2 = toNode.x - toNode.w / 2;
  const y2 = toNode.y;

  const line = gen.line(x1, y1, x2, y2, {
    roughness: 0.8,
    stroke: "var(--rough-stroke)",
    strokeWidth: 1.5,
    seed,
    bowing: 1,
  });

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 10;
  const headAngle = Math.PI / 6;

  const ah1 = gen.line(
    x2,
    y2,
    x2 - headLen * Math.cos(angle - headAngle),
    y2 - headLen * Math.sin(angle - headAngle),
    { roughness: 0.5, stroke: "var(--rough-stroke)", strokeWidth: 1.5, seed: seed + 1000 }
  );
  const ah2 = gen.line(
    x2,
    y2,
    x2 - headLen * Math.cos(angle + headAngle),
    y2 - headLen * Math.sin(angle + headAngle),
    { roughness: 0.5, stroke: "var(--rough-stroke)", strokeWidth: 1.5, seed: seed + 2000 }
  );

  return {
    linePaths: gen.toPaths(line),
    arrowPaths: [...gen.toPaths(ah1), ...gen.toPaths(ah2)],
  };
}

// Pre-compute initial rough node shapes
const initialRoughNodes: RoughNode[] = INITIAL_NODES.map((node) => ({
  paths: computeNodePaths(node),
  node,
}));

// ─── Dot grid ───

const dots: { cx: number; cy: number }[] = [];
for (let y = DOT_GAP; y < CANVAS_H; y += DOT_GAP) {
  for (let x = DOT_GAP; x < CANVAS_W; x += DOT_GAP) {
    dots.push({ cx: x, cy: y });
  }
}

// ─── Component ───

export function CanvasInteractiveMockup() {
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

  // Convert client coords to SVG viewBox coords
  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
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

  // Build current node defs with updated positions
  const currentNodes: NodeDef[] = INITIAL_NODES.map((n) => ({
    ...n,
    x: nodePositions[n.id]?.x ?? n.x,
    y: nodePositions[n.id]?.y ?? n.y,
  }));

  const nodeMap = new Map(currentNodes.map((n) => [n.id, n]));

  // Compute edges dynamically (they follow node positions)
  const currentEdges: RoughEdge[] = EDGES.map((edge) => {
    const from = nodeMap.get(edge.from)!;
    const to = nodeMap.get(edge.to)!;
    const { linePaths, arrowPaths } = computeEdgePaths(from, to, edge.seed);
    return { linePaths, arrowPaths, fromId: edge.from, toId: edge.to };
  });

  return (
    <div
      className="mt-4 relative rounded-lg border bg-card overflow-hidden select-none"
      style={
        {
          "--rough-stroke": "var(--foreground)",
        } as React.CSSProperties
      }
    >
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <style>{`
        @font-face {
          font-family: 'Virgil';
          src: url('/fonts/Virgil.woff2') format('woff2');
          font-display: swap;
        }
      `}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="w-full h-auto cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none", minHeight: 180 }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Dot grid background */}
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={0.8}
            className="fill-border"
          />
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
          // Use pre-computed paths for non-moved nodes, recompute for moved ones
          const hasMoved =
            node.x !== INITIAL_NODES.find((n) => n.id === node.id)!.x ||
            node.y !== INITIAL_NODES.find((n) => n.id === node.id)!.y;

          const paths = hasMoved
            ? computeNodePaths(node)
            : initialRoughNodes.find((rn) => rn.node.id === node.id)!.paths;

          return (
            <g
              key={node.id}
              onPointerDown={(e) => handlePointerDown(e, node.id)}
              style={{ cursor: "grab" }}
            >
              {/* Invisible larger hit area for easier grabbing */}
              <rect
                x={node.x - node.w / 2 - 4}
                y={node.y - node.h / 2 - 4}
                width={node.w + 8}
                height={node.h + 8}
                fill="transparent"
              />
              {/* Rough shape */}
              {paths.map((p, j) => (
                <path
                  key={j}
                  d={p.d}
                  stroke={p.stroke}
                  strokeWidth={p.strokeWidth}
                  fill={p.fill || "none"}
                />
              ))}
              {/* Label */}
              <text
                x={node.x}
                y={node.y + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="Virgil, Segoe Print, Comic Sans MS, cursive"
                fontSize={node.id === "root" ? 16 : 13}
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
            x={CANVAS_W / 2}
            y={CANVAS_H - 12}
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
