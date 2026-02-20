import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BassGlow } from "./BassGlow";
import { SPRING_SMOOTH } from "./constants";

interface LogoSceneProps {
  bassIntensity: number;
}

export const LogoScene: React.FC<LogoSceneProps> = ({ bassIntensity }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Entrance: spring scale from 0.8 -> 1.0
  const scaleProgress = spring({ frame, fps, config: SPRING_SMOOTH });
  const scale = interpolate(scaleProgress, [0, 1], [0.8, 1.0]);

  // Fade in
  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out in last 10 frames
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = fadeIn * fadeOut;

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BassGlow bassIntensity={bassIntensity} />
      <Img
        src={staticFile("astriq-logo-dark.png")}
        style={{
          width: 500,
          height: "auto",
          opacity,
          transform: `scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
};
