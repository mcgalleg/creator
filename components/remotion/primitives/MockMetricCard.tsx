"use client";

import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { TEXT_PRIMARY, TEXT_MUTED, FONT_SANS, SPRING_SNAPPY } from "../constants";

interface MockMetricCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  startFrame?: number;
  color?: string;
}

// Inline TrendingUp SVG path
const TrendingUpIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const TrendingDownIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </svg>
);

export const MockMetricCard: React.FC<MockMetricCardProps> = ({
  label,
  value,
  change,
  changeType = "neutral",
  startFrame = 0,
  color,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleRaw = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING_SNAPPY,
  });
  const scale = interpolate(scaleRaw, [0, 1], [0.85, 1]);

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const changeColor =
    changeType === "up"
      ? "#10B981"
      : changeType === "down"
        ? "#EF4444"
        : TEXT_MUTED;

  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 12,
        opacity,
        transform: `scale(${scale})`,
        width: "calc(50% - 8px)",
        boxSizing: "border-box",
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: TEXT_MUTED,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          color: color || TEXT_PRIMARY,
          fontWeight: 700,
          marginTop: 4,
        }}
      >
        {value}
      </div>
      {change && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            marginTop: 4,
          }}
        >
          {changeType === "up" && <TrendingUpIcon color={changeColor} />}
          {changeType === "down" && <TrendingDownIcon color={changeColor} />}
          <span style={{ fontSize: 11, color: changeColor, fontWeight: 500 }}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
};
