import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface CursorPosition {
  frame: number;
  x: number;
  y: number;
}

interface AnimatedCursorProps {
  positions: CursorPosition[];
  clickFrames?: number[];
}

export const AnimatedCursor: React.FC<AnimatedCursorProps> = ({
  positions,
  clickFrames = [],
}) => {
  const frame = useCurrentFrame();

  if (positions.length === 0) return null;

  const firstFrame = positions[0].frame;

  // Hide cursor before the first keyframe
  if (frame < firstFrame) return null;

  // Interpolate x position
  const x = interpolate(
    frame,
    positions.map((p) => p.frame),
    positions.map((p) => p.x),
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (t) => {
        // easeInOut cubic
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      },
    },
  );

  // Interpolate y position
  const y = interpolate(
    frame,
    positions.map((p) => p.frame),
    positions.map((p) => p.y),
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (t) => {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      },
    },
  );

  // Click animation: scale pulse on click frames
  let clickScale = 1;
  for (const cf of clickFrames) {
    if (frame >= cf && frame <= cf + 5) {
      clickScale = interpolate(
        frame,
        [cf, cf + 2, cf + 5],
        [1, 0.8, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );
      break;
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      <svg
        width={24}
        height={24}
        viewBox="0 0 16 24"
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `scale(${clickScale})`,
          transformOrigin: "0 0",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
        }}
      >
        <path
          d="M 0 0 L 0 20 L 5.5 15 L 9 24 L 13 22.5 L 9.5 14 L 16 14 Z"
          fill="#ffffff"
          stroke="#222222"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
};
