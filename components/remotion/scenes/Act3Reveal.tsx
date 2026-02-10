"use client";

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
  AbsoluteFill,
  Sequence,
  Img,
  staticFile,
} from "remotion";
import { KineticText } from "../primitives/KineticText";
import { CameraMove } from "../primitives/CameraMove";
import { BackgroundAmbient } from "../primitives/BackgroundAmbient";
import {
  TEXT_PRIMARY,
  TEXT_MUTED,
  FONT_SANS,
  COMP_WIDTH,
  COMP_HEIGHT,
  HEADER_HEIGHT,
  CHAT_WIDTH_RATIO,
  TAB_BAR_HEIGHT,
  SPRING_BOUNCY,
} from "../constants";

export const Act3Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo spring animation (appears F15-45)
  const logoSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: SPRING_BOUNCY,
  });

  // Logo morph: center -> top-left header position (F105-160)
  const logoMorphSpring = spring({
    frame: Math.max(0, frame - 105),
    fps,
    config: { damping: 14 },
  });
  const morphT = Math.min(logoMorphSpring, 1);

  // Logo dimensions: 240px centered -> 48px top-left
  const logoHeight = interpolate(morphT, [0, 1], [240, 48]);
  const logoCenterX = COMP_WIDTH / 2;
  const logoCenterY = COMP_HEIGHT / 2 - 40;
  const logoFinalX = 24 + 24;
  const logoFinalY = 16 + 24;
  const logoX = interpolate(morphT, [0, 1], [logoCenterX, logoFinalX]);
  const logoY = interpolate(morphT, [0, 1], [logoCenterY, logoFinalY]);

  // Chrome lines opacity (F80-100)
  const chromeOpacity = interpolate(
    frame,
    [80, 100],
    [0, 0.15],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  // Text layer fade out (F70-85)
  const textFade = interpolate(
    frame,
    [70, 85],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  // AppShell full opacity (F120-140)
  const appShellOpacity = interpolate(
    frame,
    [120, 140],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  const chatSplitX = COMP_WIDTH * CHAT_WIDTH_RATIO;

  return (
    <CameraMove
      keyframes={[
        { frame: 0, rotateX: 0, rotateY: 0, scale: 1, translateX: 0, translateY: 0 },
        { frame: 80, rotateX: 0, rotateY: 0, scale: 1, translateX: 0, translateY: 0 },
        { frame: 110, rotateX: 1, rotateY: -1.5, scale: 1.01, translateX: 0, translateY: 0 },
        { frame: 130, rotateX: 1.8, rotateY: -2.5, scale: 1.015, translateX: 0, translateY: 0 },
        { frame: 140, rotateX: 2, rotateY: -3, scale: 1.02, translateX: 0, translateY: 0 },
        { frame: 160, rotateX: 1.5, rotateY: -1.5, scale: 1.01, translateX: 0, translateY: 0 },
      ]}
    >
      <AbsoluteFill style={{ fontFamily: FONT_SANS }}>
        <BackgroundAmbient />
        {/* Layer 1: Text ("Meet" + subtitle) */}
      <AbsoluteFill style={{ opacity: textFade }}>
        {/* "Meet" text — positioned above the logo */}
        <Sequence from={5} durationInFrames={80}>
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingBottom: 480,
            }}
          >
            <KineticText
              text="Meet"
              startFrame={0}
              durationFrames={12}
              entrance={{ type: "fadeIn" }}
              style={{
                fontSize: 32,
                fontWeight: 400,
                color: TEXT_MUTED,
                textTransform: "uppercase",
                letterSpacing: 6,
              }}
            />
          </AbsoluteFill>
        </Sequence>

        {/* "AI-Powered TikTok Analytics" */}
        <Sequence from={30} durationInFrames={55}>
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 200,
            }}
          >
            <KineticText
              text="AI-Powered TikTok Analytics"
              startFrame={0}
              durationFrames={12}
              entrance={{ type: "slideIn", from: "bottom", distance: 80 }}
              style={{
                fontSize: 40,
                fontWeight: 500,
                color: TEXT_PRIMARY,
                textAlign: "center",
              }}
            />
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>

      {/* Layer 2: Chrome lines (faint borders forming app structure) */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {/* Header bottom border */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: HEADER_HEIGHT,
            height: 1,
            background: TEXT_MUTED,
            opacity: chromeOpacity,
          }}
        />
        {/* Chat/view vertical separator */}
        <div
          style={{
            position: "absolute",
            left: chatSplitX,
            top: HEADER_HEIGHT,
            bottom: 0,
            width: 1,
            background: TEXT_MUTED,
            opacity: chromeOpacity,
          }}
        />
        {/* Tab bar bottom border (inside view area) */}
        <div
          style={{
            position: "absolute",
            left: chatSplitX,
            right: 0,
            top: HEADER_HEIGHT + TAB_BAR_HEIGHT,
            height: 1,
            background: TEXT_MUTED,
            opacity: chromeOpacity,
          }}
        />
      </AbsoluteFill>

      {/* Layer 3: Full AppShell fade-in */}
      <AbsoluteFill style={{ opacity: appShellOpacity }}>
        {/* Header bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: HEADER_HEIGHT,
            background: "#18181b",
            borderBottom: "1px solid #27272a",
            display: "flex",
            alignItems: "center",
            paddingLeft: 96,
            gap: 24,
          }}
        >
          <span
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              opacity: 0.8,
            }}
          >
            Not a Bot
          </span>
        </div>

        {/* Chat panel */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: HEADER_HEIGHT,
            width: chatSplitX,
            bottom: 0,
            background: "rgba(24, 24, 27, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: TEXT_MUTED,
              opacity: 0.5,
            }}
          >
            Ask me about your analytics!
          </span>
        </div>

        {/* View area with tabs */}
        <div
          style={{
            position: "absolute",
            left: chatSplitX,
            top: HEADER_HEIGHT,
            right: 0,
            bottom: 0,
            background: "rgba(15, 15, 17, 0.4)",
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              height: TAB_BAR_HEIGHT,
              borderBottom: "1px solid #27272a",
              display: "flex",
              alignItems: "center",
              paddingLeft: 24,
              gap: 32,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: TEXT_PRIMARY,
                borderBottom: "2px solid #F59E0B",
                paddingBottom: 12,
                lineHeight: "60px",
              }}
            >
              Dashboard
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: 400,
                color: TEXT_MUTED,
                lineHeight: "60px",
              }}
            >
              Draw
            </span>
          </div>
        </div>
      </AbsoluteFill>

      {/* Layer 4: Logo (on top of everything, animated) */}
      {frame >= 15 && (
        <div
          style={{
            position: "absolute",
            left: logoX,
            top: logoY,
            transform: `translate(-50%, -50%) scale(${frame < 105 ? logoSpring : 1})`,
            zIndex: 10,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{
              height: logoHeight,
              width: "auto",
              filter: "invert(1)",
            }}
          />
        </div>
      )}
      </AbsoluteFill>
    </CameraMove>
  );
};
