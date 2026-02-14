import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";

interface CaptionOverlayProps {
  text: string;
  fadeInFrame: number;
  fadeOutFrame: number;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  text,
  fadeInFrame,
  fadeOutFrame,
}) => {
  const frame = useCurrentFrame();

  // Don't render outside the visible range
  if (frame < fadeInFrame || frame > fadeOutFrame) return null;

  // Fade in over 15 frames
  const fadeInOpacity = interpolate(
    frame,
    [fadeInFrame, fadeInFrame + 15],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Fade out over 15 frames
  const fadeOutOpacity = interpolate(
    frame,
    [fadeOutFrame - 15, fadeOutFrame],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const opacity = Math.min(fadeInOpacity, fadeOutOpacity);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          marginBottom: 120,
          maxWidth: "70%",
          marginRight: "10%",
          textAlign: "center",
          color: "#fafafa",
          fontSize: 32,
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          opacity,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
