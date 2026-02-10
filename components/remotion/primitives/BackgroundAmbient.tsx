"use client";

import React from "react";
import { useCurrentFrame, interpolate, interpolateColors, AbsoluteFill } from "remotion";
import { BG_DARK, BG_DARK_2 } from "../constants";

interface BackgroundAmbientProps {
  particleCount?: number;
}

const seededRandom = (i: number) => ((i * 9301 + 49297) % 233280) / 233280;

export const BackgroundAmbient: React.FC<BackgroundAmbientProps> = ({
  particleCount = 6,
}) => {
  const frame = useCurrentFrame();

  // Slowly shifting radial gradient
  const gradientAngle = interpolate(frame, [0, 300], [135, 225], {
    extrapolateRight: "extend",
  });

  const gradientColor = interpolateColors(
    frame % 300,
    [0, 150, 300],
    [BG_DARK, "#1a1a2e", BG_DARK_2]
  );

  // Generate particles with seeded positions
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const seed = seededRandom(i);
    const baseX = seed * 100;
    const baseY = (seededRandom(i + 50) * 100);
    const size = 4 + seed * 6;
    const speed = 0.02 + seed * 0.03;
    const phase = seed * Math.PI * 2;

    const x = baseX + Math.sin(frame * speed + phase) * 3;
    const y = baseY + Math.cos(frame * speed * 0.7 + phase) * 2;
    const opacity = interpolate(
      Math.sin(frame * speed * 0.5 + phase),
      [-1, 1],
      [0.1, 0.4]
    );

    return { x, y, size, opacity, color: i % 2 === 0 ? "#F59E0B" : "#3B82F6" };
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${BG_DARK} 0%, ${gradientColor} 50%, ${BG_DARK_2} 100%)`,
      }}
    >
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            filter: `blur(${p.size / 2}px)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
