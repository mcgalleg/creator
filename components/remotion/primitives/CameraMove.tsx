"use client";

import React from "react";
import { useCurrentFrame, interpolate, Easing, AbsoluteFill } from "remotion";

interface CameraKeyframe {
  frame: number;
  rotateX?: number;
  rotateY?: number;
  scale?: number;
  translateX?: number;
  translateY?: number;
}

interface CameraMoveProps {
  children: React.ReactNode;
  keyframes: CameraKeyframe[];
  perspective?: number;
}

export const CameraMove: React.FC<CameraMoveProps> = ({
  children,
  keyframes,
  perspective = 2000,
}) => {
  const frame = useCurrentFrame();

  const frames = keyframes.map((k) => k.frame);
  const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: Easing.inOut(Easing.cubic) };

  const rotateX = interpolate(frame, frames, keyframes.map((k) => k.rotateX ?? 0), clamp);
  const rotateY = interpolate(frame, frames, keyframes.map((k) => k.rotateY ?? 0), clamp);
  const scale = interpolate(frame, frames, keyframes.map((k) => k.scale ?? 1), clamp);
  const translateX = interpolate(frame, frames, keyframes.map((k) => k.translateX ?? 0), clamp);
  const translateY = interpolate(frame, frames, keyframes.map((k) => k.translateY ?? 0), clamp);

  return (
    <AbsoluteFill style={{ perspective }}>
      <AbsoluteFill
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
