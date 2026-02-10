"use client";

import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { KineticText } from "../primitives/KineticText";
import { TypewriterText } from "../primitives/TypewriterText";
import { FloatingDataPoint } from "../primitives/FloatingDataPoint";
import { BackgroundAmbient } from "../primitives/BackgroundAmbient";
import {
  ACCENT,
  TEXT_PRIMARY,
  CHART_BLUE,
  CHART_GREEN,
  CHART_AMBER,
  CHART_RED,
  FONT_SANS,
  COMP_WIDTH,
  COMP_HEIGHT,
} from "../constants";

export const Act2Discovery: React.FC = () => {
  const cx = COMP_WIDTH / 2;
  const cy = COMP_HEIGHT / 2;

  return (
    <AbsoluteFill style={{ fontFamily: FONT_SANS }}>
      <BackgroundAmbient />
      {/* Typewriter: "Your data has a story." */}
      <Sequence from={0} durationInFrames={55}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TypewriterText
            text="Your data has a story."
            startFrame={0}
            charsPerFrame={0.5}
            style={{
              fontSize: 76,
              fontWeight: 600,
              color: TEXT_PRIMARY,
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Floating data points orbiting center */}
      <Sequence from={15} durationInFrames={125}>
        <AbsoluteFill>
          <FloatingDataPoint
            value="142K"
            centerX={cx}
            centerY={cy}
            radiusX={420}
            radiusY={280}
            speed={0.05}
            phase={0}
            startFrame={0}
            exitFrame={125}
            glowColor={CHART_BLUE}
          />
          <FloatingDataPoint
            value="24.5K"
            centerX={cx}
            centerY={cy}
            radiusX={360}
            radiusY={240}
            speed={0.07}
            phase={Math.PI / 2}
            startFrame={0}
            exitFrame={125}
            glowColor={CHART_GREEN}
          />
          <FloatingDataPoint
            value="8.2%"
            centerX={cx}
            centerY={cy}
            radiusX={300}
            radiusY={200}
            speed={0.09}
            phase={Math.PI}
            startFrame={0}
            exitFrame={125}
            glowColor={CHART_AMBER}
          />
          <FloatingDataPoint
            value="+47"
            centerX={cx}
            centerY={cy}
            radiusX={360}
            radiusY={240}
            speed={0.07}
            phase={(3 * Math.PI) / 2}
            startFrame={0}
            exitFrame={125}
            glowColor={CHART_RED}
          />
        </AbsoluteFill>
      </Sequence>

      {/* "Hidden patterns." — above center, blur entrance */}
      <Sequence from={55} durationInFrames={30}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 160,
          }}
        >
          <KineticText
            text="Hidden patterns."
            startFrame={0}
            durationFrames={15}
            exitFrame={20}
            exitDurationFrames={10}
            entrance={{ type: "blur", from: 20, to: 0 }}
            exit={{ type: "fadeOut" }}
            style={{
              fontSize: 68,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              textAlign: "center",
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* "Untapped potential." — below center, slide from bottom */}
      <Sequence from={85} durationInFrames={35}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 160,
          }}
        >
          <KineticText
            text="Untapped potential."
            startFrame={0}
            durationFrames={15}
            exitFrame={20}
            exitDurationFrames={15}
            entrance={{ type: "slideIn", from: "bottom", distance: 120 }}
            exit={{ type: "scaleOut", to: 0 }}
            style={{
              fontSize: 72,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              textAlign: "center",
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* "What if you could just... ask?" */}
      <Sequence from={120} durationInFrames={60}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "baseline",
              gap: "0 20px",
            }}
          >
            <KineticText
              text="What if you could just..."
              startFrame={0}
              durationFrames={40}
              entrance={{ type: "wordByWord", delayPerWord: 7 }}
              style={{
                fontSize: 72,
                fontWeight: 500,
                color: TEXT_PRIMARY,
              }}
            />
            <KineticText
              text="ask?"
              startFrame={38}
              durationFrames={20}
              entrance={{ type: "scaleIn", from: 0.3, bounce: true }}
              style={{
                fontSize: 96,
                fontWeight: 700,
                color: ACCENT,
                marginLeft: 8,
              }}
            />
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
