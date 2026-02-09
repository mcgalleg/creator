"use client";

import React from "react";
import { useCurrentFrame, interpolate } from "remotion";

interface TypewriterTextProps {
  text: string;
  startFrame?: number;
  charsPerFrame?: number;
  showCursor?: boolean;
  style?: React.CSSProperties;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  charsPerFrame = 0.5,
  showCursor = true,
  style,
}) => {
  const frame = useCurrentFrame();

  const elapsed = Math.max(0, frame - startFrame);
  const charsToShow = Math.min(
    text.length,
    Math.floor(elapsed * charsPerFrame)
  );

  const cursorOpacity = interpolate(frame % 16, [0, 8, 16], [1, 0, 1]);

  const displayText = text.slice(0, charsToShow);
  const isComplete = charsToShow >= text.length;

  return (
    <span
      style={{
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        whiteSpace: "pre-wrap",
        ...style,
      }}
    >
      {displayText}
      {showCursor && (
        <span
          style={{
            opacity: isComplete ? cursorOpacity : 1,
            marginLeft: 1,
          }}
        >
          {"\u258C"}
        </span>
      )}
    </span>
  );
};
