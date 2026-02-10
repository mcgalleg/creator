"use client";

import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";
import { ACCENT, FONT_SANS, SPRING_BOUNCY } from "../constants";

interface GlowButtonProps {
  text: string;
  startFrame?: number;
  glowColor?: string;
  style?: React.CSSProperties;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  text,
  startFrame = 0,
  glowColor = ACCENT,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(
    frame,
    [startFrame, startFrame + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  const scaleRaw = spring({
    frame: frame - startFrame,
    fps,
    config: SPRING_BOUNCY,
  });
  const scale = interpolate(scaleRaw, [0, 1], [0.9, 1.0]);

  // Glow oscillation: boxShadow spread 0-12px
  const glowSpread = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0, 24]
  );

  return (
    <div
      style={{
        borderRadius: 999,
        border: `4px solid ${glowColor}`,
        padding: "24px 64px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fadeIn,
        transform: `scale(${scale})`,
        boxShadow: `0 0 ${glowSpread}px ${glowColor}, 0 0 ${glowSpread * 2}px ${glowColor}40`,
        fontFamily: FONT_SANS,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 32,
          fontWeight: 600,
          color: glowColor,
        }}
      >
        {text}
      </span>
    </div>
  );
};
