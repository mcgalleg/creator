"use client";

import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { TEXT_PRIMARY, FONT_SANS } from "../constants";

interface FloatingDataPointProps {
  value: string;
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  phase: number;
  startFrame?: number;
  exitFrame?: number;
  glowColor?: string;
  trailCount?: number;
  style?: React.CSSProperties;
}

export const FloatingDataPoint: React.FC<FloatingDataPointProps> = ({
  value,
  centerX,
  centerY,
  radiusX,
  radiusY,
  speed,
  phase,
  startFrame = 0,
  exitFrame,
  glowColor = "#F59E0B",
  trailCount = 3,
  style,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(
    frame,
    [startFrame, startFrame + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // After exitFrame, converge radius to 0
  let currentRadiusX = radiusX;
  let currentRadiusY = radiusY;
  if (exitFrame !== undefined && frame >= exitFrame) {
    const converge = interpolate(
      frame,
      [exitFrame, exitFrame + 40],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    currentRadiusX = radiusX * converge;
    currentRadiusY = radiusY * converge;
  }

  const getPosition = (f: number) => {
    const x = centerX + currentRadiusX * Math.cos(f * speed + phase);
    const y = centerY + currentRadiusY * Math.sin(f * speed + phase);
    return { x, y };
  };

  const current = getPosition(frame);

  // Trail copies at prior frame positions
  const trails = [];
  for (let t = 1; t <= trailCount; t++) {
    const trailFrame = Math.max(startFrame, frame - t * 3);
    const pos = getPosition(trailFrame);
    const trailOpacity = (1 - t / (trailCount + 1)) * 0.3 * fadeIn;
    trails.push(
      <div
        key={t}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          transform: "translate(-50%, -50%)",
          fontSize: 28,
          fontWeight: 700,
          fontFamily: FONT_SANS,
          color: glowColor,
          opacity: trailOpacity,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    );
  }

  return (
    <>
      {trails}
      <div
        style={{
          position: "absolute",
          left: current.x,
          top: current.y,
          transform: "translate(-50%, -50%)",
          fontSize: 32,
          fontWeight: 700,
          fontFamily: FONT_SANS,
          color: TEXT_PRIMARY,
          opacity: fadeIn,
          whiteSpace: "nowrap",
          boxShadow: `0 0 24px ${glowColor}, 0 0 48px ${glowColor}40`,
          background: "rgba(15, 15, 17, 0.7)",
          padding: "8px 20px",
          borderRadius: 16,
          border: `2px solid ${glowColor}40`,
          ...style,
        }}
      >
        {value}
      </div>
    </>
  );
};
