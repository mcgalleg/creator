"use client";

import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface SkeletonPulseProps {
  lines?: number;
  startFrame?: number;
}

const WIDTHS = ["100%", "85%", "70%"];
const HEIGHTS = [12, 8];

export const SkeletonPulse: React.FC<SkeletonPulseProps> = ({
  lines = 3,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(
    frame,
    [startFrame, startFrame + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Pulse: oscillate between 0.4 and 1.0
  const pulse = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.4, 1.0]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: fadeIn }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            width: WIDTHS[i % WIDTHS.length],
            height: HEIGHTS[i % HEIGHTS.length],
            borderRadius: 4,
            background: "rgba(255,255,255,0.08)",
            opacity: pulse,
          }}
        />
      ))}
    </div>
  );
};
