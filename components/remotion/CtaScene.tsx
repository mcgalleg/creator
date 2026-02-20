import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { BassGlow } from "./BassGlow";
import { ACCENT_AMBER, ACCENT_AMBER_DIM, TEXT_WHITE, SPRING_SMOOTH } from "./constants";

interface CtaSceneProps {
  bassIntensity: number;
}

export const CtaScene: React.FC<CtaSceneProps> = ({ bassIntensity }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo entrance
  const logoScale = spring({ frame, fps, config: SPRING_SMOOTH });
  const logoS = interpolate(logoScale, [0, 1], [0.85, 1.0]);
  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline entrance (delayed)
  const taglineOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [40, 60], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CTA button entrance (further delayed)
  const ctaOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaY = interpolate(frame, [70, 90], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Bass-reactive breathing
  const breathe = 1 + bassIntensity * 0.03;
  const glowSize = 20 + bassIntensity * 30;

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <BassGlow bassIntensity={bassIntensity} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 30,
          transform: `scale(${breathe})`,
        }}
      >
        {/* Logo */}
        <Img
          src={staticFile("astriq-logo-dark.png")}
          style={{
            width: 520,
            height: "auto",
            opacity: logoOpacity,
            transform: `scale(${logoS})`,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            color: TEXT_WHITE,
            opacity: taglineOpacity * 0.7,
            fontSize: 36,
            fontWeight: 400,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            letterSpacing: "0.05em",
            transform: `translateY(${taglineY}px)`,
          }}
        >
          AI analytics for creators
        </div>

        {/* CTA Button */}
        <div
          style={{
            opacity: ctaOpacity,
            transform: `translateY(${ctaY}px)`,
            padding: "16px 48px",
            borderRadius: 50,
            border: `2px solid ${ACCENT_AMBER}`,
            color: TEXT_WHITE,
            fontSize: 24,
            fontWeight: 700,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            letterSpacing: "0.02em",
            boxShadow: `0 0 ${glowSize}px ${ACCENT_AMBER_DIM}, inset 0 0 ${glowSize * 0.5}px ${ACCENT_AMBER_DIM}`,
          }}
        >
          Start Free Trial
        </div>
      </div>
    </AbsoluteFill>
  );
};
