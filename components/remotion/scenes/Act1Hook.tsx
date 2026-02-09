"use client";

import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { KineticText } from "../primitives/KineticText";
import {
  BG_DARK,
  BG_DARK_2,
  ACCENT,
  TEXT_PRIMARY,
  TEXT_MUTED,
  FONT_SANS,
} from "../constants";

export const Act1Hook: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${BG_DARK} 0%, ${BG_DARK_2} 100%)`,
        fontFamily: FONT_SANS,
      }}
    >
      {/* Line 1: "You pour your heart into every video." */}
      <Sequence from={0} durationInFrames={35}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <KineticText
            text="You pour your heart into every video."
            startFrame={0}
            durationFrames={20}
            exitFrame={25}
            exitDurationFrames={10}
            entrance={{ type: "slideIn", from: "left" }}
            exit={{ type: "slideOut", to: "right" }}
            style={{
              fontSize: 44,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              textAlign: "center",
              padding: "0 40px",
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Line 2: "Hours of filming. Editing. Posting." */}
      <Sequence from={35} durationInFrames={40}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <KineticText
            text="Hours of filming. Editing. Posting."
            startFrame={0}
            durationFrames={36}
            exitFrame={35}
            exitDurationFrames={10}
            entrance={{ type: "wordByWord", delayPerWord: 8 }}
            exit={{ type: "fadeOut" }}
            style={{
              fontSize: 38,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              textAlign: "center",
              padding: "0 40px",
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Line 3: "But do you really know..." */}
      <Sequence from={80} durationInFrames={80}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 40,
          }}
        >
          <KineticText
            text="But do you really know..."
            startFrame={0}
            durationFrames={25}
            entrance={{ type: "fadeIn" }}
            style={{
              fontSize: 30,
              fontWeight: 400,
              color: TEXT_MUTED,
              textAlign: "center",
              padding: "0 40px",
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Line 4: "...what's working?" */}
      <Sequence from={100} durationInFrames={60}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 30,
          }}
        >
          <KineticText
            text="...what's working?"
            startFrame={0}
            durationFrames={25}
            exitFrame={45}
            exitDurationFrames={15}
            entrance={{ type: "scaleIn", from: 0.05, bounce: true }}
            exit={{ type: "scatter" }}
            style={{
              fontSize: 60,
              fontWeight: 700,
              color: ACCENT,
              textAlign: "center",
            }}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
