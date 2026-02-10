"use client";

import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { evolvePath } from "@remotion/paths";

const CHART_BLUE = "#60a5fa";

interface MockLineChartProps {
  startFrame?: number;
  durationFrames?: number;
  data?: number[];
}

export const MockLineChart: React.FC<MockLineChartProps> = ({
  startFrame = 0,
  durationFrames = 40,
  data = [20, 45, 35, 60, 50, 75, 65, 85, 70, 90],
}) => {
  const frame = useCurrentFrame();

  const svgWidth = 560;
  const svgHeight = 280;
  const paddingX = 40;
  const paddingTop = 30;
  const paddingBottom = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;

  // Build polyline points
  const points = data.map((val, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    const y = paddingTop + (1 - (val - minVal) / range) * chartHeight;
    return { x, y };
  });

  // Build smooth SVG path using line segments
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  // Area fill path (closed shape)
  const areaPath = `${linePath} L ${points[points.length - 1].x},${paddingTop + chartHeight} L ${points[0].x},${paddingTop + chartHeight} Z`;

  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, linePath);

  // Area fill fades in after line is mostly drawn
  const areaOpacity = interpolate(
    frame,
    [startFrame + durationFrames * 0.6, startFrame + durationFrames],
    [0, 0.15],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const gradientId = "lineChartGradient";

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART_BLUE} stopOpacity={1} />
          <stop offset="100%" stopColor={CHART_BLUE} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Subtle horizontal grid lines */}
      {[0.25, 0.5, 0.75].map((ratio) => {
        const y = paddingTop + chartHeight * (1 - ratio);
        return (
          <line
            key={ratio}
            x1={paddingX}
            y1={y}
            x2={svgWidth - paddingX}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={2}
          />
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} opacity={areaOpacity} />

      {/* Animated line */}
      <path
        d={linePath}
        fill="none"
        stroke={CHART_BLUE}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
      />

      {/* Data point dots that appear as line reaches them */}
      {points.map((p, i) => {
        const pointProgress = interpolate(
          progress,
          [i / (data.length - 1) - 0.05, i / (data.length - 1) + 0.05],
          [0, 1],
          { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
        );
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={6}
            fill={CHART_BLUE}
            opacity={pointProgress}
          />
        );
      })}
    </svg>
  );
};
