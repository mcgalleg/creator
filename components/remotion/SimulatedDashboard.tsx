import React from "react";
import { interpolate } from "remotion";
import { DARK, TEXT_WHITE } from "./constants";

interface SimulatedDashboardProps {
  frame: number;
  animationStartFrame: number;
}

// ─── KPI definitions ───

interface KpiDef {
  label: string;
  targetValue: number;
  format: (n: number) => string;
  change: string | null;
  activateOffset: number; // frames after animationStartFrame
}

const KPIS: KpiDef[] = [
  {
    label: "Followers",
    targetValue: 8547,
    format: (n) => Math.floor(n).toLocaleString("en-US"),
    change: "+12.3%",
    activateOffset: 30,
  },
  {
    label: "Total Plays",
    targetValue: 234,
    format: (n) => `${Math.floor(n)}K`,
    change: "+8.7%",
    activateOffset: 60,
  },
  {
    label: "Engagement Rate",
    targetValue: 4.2,
    format: (n) => `${n.toFixed(1)}%`,
    change: "+0.5%",
    activateOffset: 90,
  },
  {
    label: "Content Velocity",
    targetValue: 12,
    format: (n) => `${Math.floor(n)} videos`,
    change: null,
    activateOffset: 90,
  },
];

// ─── Chart SVG paths (7 data points, smooth bezier curves) ───
// Chart area: x from 60 to 100% width, y from 0 to 240px
// We'll work in a viewBox of 0 0 800 240

// Likes data: [2.1, 3.5, 2.8, 4.2, 3.8, 5.1, 4.5] as percentages
// Map to Y: max ~6%, so y = 240 - (val/6)*220  (leaving 20px top margin)
// x positions: evenly spaced across 60..740 (7 points)
const likesPoints = [
  { x: 60, y: 240 - (2.1 / 6) * 220 },
  { x: 173, y: 240 - (3.5 / 6) * 220 },
  { x: 286, y: 240 - (2.8 / 6) * 220 },
  { x: 400, y: 240 - (4.2 / 6) * 220 },
  { x: 513, y: 240 - (3.8 / 6) * 220 },
  { x: 626, y: 240 - (5.1 / 6) * 220 },
  { x: 740, y: 240 - (4.5 / 6) * 220 },
];

// Comments data: [0.8, 1.2, 0.9, 1.5, 1.3, 1.8, 1.6]
const commentsPoints = [
  { x: 60, y: 240 - (0.8 / 6) * 220 },
  { x: 173, y: 240 - (1.2 / 6) * 220 },
  { x: 286, y: 240 - (0.9 / 6) * 220 },
  { x: 400, y: 240 - (1.5 / 6) * 220 },
  { x: 513, y: 240 - (1.3 / 6) * 220 },
  { x: 626, y: 240 - (1.8 / 6) * 220 },
  { x: 740, y: 240 - (1.6 / 6) * 220 },
];

function buildSmoothPath(
  points: { x: number; y: number }[]
): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (curr.x - prev.x) * 0.5;
    const cpy2 = curr.y;
    d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
  }
  return d;
}

function buildAreaPath(
  points: { x: number; y: number }[],
  baseline: number
): string {
  const linePath = buildSmoothPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

const LIKES_LINE = buildSmoothPath(likesPoints);
const LIKES_AREA = buildAreaPath(likesPoints, 240);
const COMMENTS_LINE = buildSmoothPath(commentsPoints);
const COMMENTS_AREA = buildAreaPath(commentsPoints, 240);

const PATH_LENGTH = 1000;

// ─── KPI Card component ───

const KpiCard: React.FC<{
  kpi: KpiDef;
  frame: number;
  activateFrame: number;
}> = ({ kpi, frame, activateFrame }) => {
  const localFrame = frame - activateFrame;

  // Count-up: 0 to target over 30 frames
  const value = interpolate(localFrame, [0, 30], [0, kpi.targetValue], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Change badge fades in over 10 frames after count-up finishes (frame 30..40)
  const changeOpacity = kpi.change
    ? interpolate(localFrame, [30, 40], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Only show content once activation has begun
  const started = localFrame >= 0;

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: DARK.card,
        borderRadius: 12,
        padding: 20,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: DARK.mutedFg,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          marginBottom: 8,
        }}
      >
        {kpi.label}
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: TEXT_WHITE,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          lineHeight: 1.1,
        }}
      >
        {started ? kpi.format(value) : kpi.format(0)}
      </div>
      {kpi.change && (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            fontWeight: 600,
            color: DARK.green,
            fontFamily: "var(--font-mono), monospace",
            opacity: changeOpacity,
          }}
        >
          {kpi.change}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───

export const SimulatedDashboard: React.FC<SimulatedDashboardProps> = ({
  frame,
  animationStartFrame,
}) => {
  // Chart draw-in range: animationStartFrame+110 to animationStartFrame+200
  const chartDrawStart = animationStartFrame + 110;
  const chartDrawEnd = animationStartFrame + 200;

  const strokeOffset = interpolate(
    frame,
    [chartDrawStart, chartDrawEnd],
    [PATH_LENGTH, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const likesAreaOpacity = interpolate(
    frame,
    [chartDrawStart, chartDrawEnd],
    [0, 0.3],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const commentsAreaOpacity = interpolate(
    frame,
    [chartDrawStart, chartDrawEnd],
    [0, 0.2],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Y-axis labels
  const yLabels = ["6%", "4%", "2%", "0%"];
  const yPositions = [20, 93, 167, 240]; // corresponding Y positions in viewBox

  // Vertical grid lines (5 evenly spaced)
  const gridXPositions = [196, 332, 468, 604, 740];

  return (
    <div
      style={{
        padding: 16,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── KPI Cards ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexShrink: 0 }}>
        {KPIS.map((kpi, i) => (
          <KpiCard
            key={i}
            kpi={kpi}
            frame={frame}
            activateFrame={animationStartFrame + kpi.activateOffset}
          />
        ))}
      </div>

      {/* ── Engagement Chart ── */}
      <div
        style={{
          width: "100%",
          flex: 1,
          minHeight: 0,
          backgroundColor: DARK.card,
          borderRadius: 12,
          padding: 16,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Chart header */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            marginBottom: 12,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: TEXT_WHITE,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            Engagement Overview
          </span>
          <span
            style={{
              fontSize: 12,
              color: DARK.mutedFg,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            Last 30 days
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: DARK.chart1 }} />
              <span style={{ fontSize: 12, color: DARK.mutedFg, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>Views</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: DARK.chart2 }} />
              <span style={{ fontSize: 12, color: DARK.mutedFg, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>Likes</span>
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 240"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", flex: 1, minHeight: 0 }}
        >
          {/* Y-axis labels */}
          {yLabels.map((label, i) => (
            <text
              key={`y-${i}`}
              x="40"
              y={yPositions[i] + 4}
              textAnchor="end"
              fill={DARK.mutedFg}
              fontSize="11"
              fontFamily="var(--font-mono), monospace"
            >
              {label}
            </text>
          ))}

          {/* Horizontal grid lines */}
          {yPositions.map((y, i) => (
            <line
              key={`hg-${i}`}
              x1="60"
              y1={y}
              x2="740"
              y2={y}
              stroke={DARK.border}
              strokeWidth={1}
            />
          ))}

          {/* Vertical grid lines */}
          {gridXPositions.map((x, i) => (
            <line
              key={`vg-${i}`}
              x1={x}
              y1="20"
              x2={x}
              y2="240"
              stroke={DARK.border}
              strokeWidth={1}
            />
          ))}

          {/* Likes area fill */}
          <path
            d={LIKES_AREA}
            fill={DARK.chart1}
            opacity={likesAreaOpacity}
          />

          {/* Likes line (stroke-dasharray draw-in) */}
          <path
            d={LIKES_LINE}
            fill="none"
            stroke={DARK.chart1}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={PATH_LENGTH}
            strokeDashoffset={strokeOffset}
          />

          {/* Comments area fill */}
          <path
            d={COMMENTS_AREA}
            fill={DARK.chart2}
            opacity={commentsAreaOpacity}
          />

          {/* Comments line (stroke-dasharray draw-in) */}
          <path
            d={COMMENTS_LINE}
            fill="none"
            stroke={DARK.chart2}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={PATH_LENGTH}
            strokeDashoffset={strokeOffset}
          />
        </svg>
      </div>
    </div>
  );
};
