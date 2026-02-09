"use client";

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  staticFile,
} from "remotion";
import { GlowButton } from "../primitives/GlowButton";
import {
  BG_DARK,
  ACCENT,
  FONT_SANS,
  HEADER_HEIGHT,
  CHAT_WIDTH_RATIO,
  TAB_BAR_HEIGHT,
  SPRING_BOUNCY,
} from "../constants";

export const Act7Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // F0-20: App scales down 1.0 -> 0.85
  const appScale = interpolate(
    frame,
    [0, 20],
    [1.0, 0.85],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // F0-20: Dark overlay opacity 0 -> 0.7
  const overlayOpacity = interpolate(
    frame,
    [0, 20],
    [0, 0.7],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // F15-35: Logo bounces in
  const logoSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: SPRING_BOUNCY,
  });

  const logoOpacity = interpolate(
    frame,
    [15, 25],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // F85-100: Fade to BG_DARK for seamless loop
  const finalFadeOpacity = interpolate(
    frame,
    [85, 100],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const borderColor = "rgba(255,255,255,0.08)";

  return (
    <AbsoluteFill style={{ backgroundColor: BG_DARK, fontFamily: FONT_SANS }}>
      {/* Background: simplified static AppShell, scaled down */}
      <AbsoluteFill
        style={{
          transform: `scale(${appScale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#0f0f11",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              height: HEADER_HEIGHT,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              borderBottom: `1px solid ${borderColor}`,
              flexShrink: 0,
            }}
          >
            <Img
              src={staticFile("logo.png")}
              style={{ height: 24, objectFit: "contain", filter: "invert(1)" }}
            />
          </div>
          {/* Body */}
          <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
            {/* Chat panel */}
            <div
              style={{
                width: `${CHAT_WIDTH_RATIO * 100}%`,
                borderRight: `1px solid ${borderColor}`,
                background: "#18181b",
              }}
            />
            {/* View panel */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  height: TAB_BAR_HEIGHT,
                  borderBottom: `1px solid ${borderColor}`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, background: "#18181b" }} />
            </div>
          </div>
        </div>
      </AbsoluteFill>

      {/* Dark overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: BG_DARK,
          opacity: overlayOpacity,
        }}
      />

      {/* Centered CTA content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {/* Logo */}
        {frame >= 15 && (
          <div
            style={{
              opacity: logoOpacity,
              transform: `scale(${logoSpring})`,
            }}
          >
            <Img
              src={staticFile("logo.png")}
              style={{
                height: 80,
                width: "auto",
                filter: "invert(1)",
              }}
            />
          </div>
        )}

        {/* CTA Button */}
        {frame >= 30 && (
          <GlowButton
            text="Start Free Trial →"
            startFrame={30}
            glowColor={ACCENT}
          />
        )}
      </AbsoluteFill>

      {/* Final fade to BG_DARK for seamless loop */}
      <AbsoluteFill
        style={{
          backgroundColor: BG_DARK,
          opacity: finalFadeOpacity,
        }}
      />
    </AbsoluteFill>
  );
};
