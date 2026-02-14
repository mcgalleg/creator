import React from "react";
import { AbsoluteFill } from "remotion";
import { ACCENT_AMBER } from "./constants";

interface BassGlowProps {
  bassIntensity: number; // 0 to ~1
  color?: string;
}

export const BassGlow: React.FC<BassGlowProps> = ({ bassIntensity, color = ACCENT_AMBER }) => {
  const scale = 1 + bassIntensity * 0.5;
  const opacity = 0.15 + bassIntensity * 0.4;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity,
          transform: `scale(${scale})`,
          filter: "blur(80px)",
        }}
      />
    </AbsoluteFill>
  );
};
