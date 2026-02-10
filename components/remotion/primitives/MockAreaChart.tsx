"use client";

import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { evolvePath } from "@remotion/paths";
import { CHART_BLUE, CHART_GREEN, TEXT_PRIMARY, TEXT_MUTED, FONT_SANS } from "../constants";

interface MockAreaChartProps {
  startFrame?: number;
  durationFrames?: number;
}

const PLAYS_DATA = [120, 180, 150, 220, 190, 250, 230, 280, 260, 300, 270, 310];
const LIKES_DATA = [40, 60, 55, 80, 70, 95, 85, 110, 100, 120, 105, 130];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SVG_W = 880;
const SVG_H = 400;
const PAD_LEFT = 60;
const PAD_RIGHT = 20;
const PAD_TOP = 20;
const PAD_BOTTOM = 48;
const CHART_W = SVG_W - PAD_LEFT - PAD_RIGHT;
const CHART_H = SVG_H - PAD_TOP - PAD_BOTTOM;

function buildPath(data: number[], maxVal: number): string {
  return data
    .map((val, i) => {
      const x = PAD_LEFT + (i / (data.length - 1)) * CHART_W;
      const y = PAD_TOP + (1 - val / maxVal) * CHART_H;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");
}

function buildAreaPath(data: number[], maxVal: number): string {
  const line = buildPath(data, maxVal);
  const lastX = PAD_LEFT + ((data.length - 1) / (data.length - 1)) * CHART_W;
  const firstX = PAD_LEFT;
  const bottomY = PAD_TOP + CHART_H;
  return `${line} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
}

export const MockAreaChart: React.FC<MockAreaChartProps> = ({
  startFrame = 0,
  durationFrames = 120,
}) => {
  const frame = useCurrentFrame();

  const maxVal = Math.max(...PLAYS_DATA);

  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const playsLine = buildPath(PLAYS_DATA, maxVal);
  const likesLine = buildPath(LIKES_DATA, maxVal);
  const playsArea = buildAreaPath(PLAYS_DATA, maxVal);
  const likesArea = buildAreaPath(LIKES_DATA, maxVal);

  const playsEvolve = evolvePath(progress, playsLine);
  const likesEvolve = evolvePath(progress, likesLine);

  const areaOpacity = interpolate(progress, [0.6, 1], [0, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        padding: 24,
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: TEXT_PRIMARY,
          marginBottom: 16,
        }}
      >
        Engagement Trends
      </div>
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="areaGradPlays" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_BLUE} stopOpacity={1} />
            <stop offset="100%" stopColor={CHART_BLUE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="areaGradLikes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_GREEN} stopOpacity={1} />
            <stop offset="100%" stopColor={CHART_GREEN} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = PAD_TOP + CHART_H * (1 - ratio);
          return (
            <line
              key={ratio}
              x1={PAD_LEFT}
              y1={y}
              x2={SVG_W - PAD_RIGHT}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={2}
            />
          );
        })}

        {/* Area fills */}
        <path d={playsArea} fill="url(#areaGradPlays)" opacity={areaOpacity} />
        <path d={likesArea} fill="url(#areaGradLikes)" opacity={areaOpacity} />

        {/* Plays line */}
        <path
          d={playsLine}
          fill="none"
          stroke={CHART_BLUE}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={playsEvolve.strokeDasharray}
          strokeDashoffset={playsEvolve.strokeDashoffset}
        />

        {/* Likes line */}
        <path
          d={likesLine}
          fill="none"
          stroke={CHART_GREEN}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={likesEvolve.strokeDasharray}
          strokeDashoffset={likesEvolve.strokeDashoffset}
        />

        {/* X-axis labels */}
        {MONTHS.map((month, i) => {
          const x = PAD_LEFT + (i / (MONTHS.length - 1)) * CHART_W;
          return (
            <text
              key={month}
              x={x}
              y={SVG_H - 8}
              textAnchor="middle"
              fill={TEXT_MUTED}
              fontSize={18}
              fontFamily={FONT_SANS}
            >
              {month}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 32, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: CHART_BLUE }} />
          <span style={{ fontSize: 20, color: TEXT_MUTED }}>Plays</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: CHART_GREEN }} />
          <span style={{ fontSize: 20, color: TEXT_MUTED }}>Likes</span>
        </div>
      </div>
    </div>
  );
};
