"use client";

import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { KineticText } from "../primitives/KineticText";
import { BackgroundAmbient } from "../primitives/BackgroundAmbient";
import {
  ACCENT,
  TEXT_PRIMARY,
  TEXT_MUTED,
  FONT_SANS,
} from "../constants";

export const Act1Hook: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: FONT_SANS }}>
      <BackgroundAmbient />
      {/* Line 1: "You pour your heart into every video." — extended to 55 frames */}
      <Sequence from={0} durationInFrames={55}>
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
            exitFrame={40}
            exitDurationFrames={10}
            entrance={{ type: "slideIn", from: "left" }}
            exit={{ type: "slideOut", to: "right" }}
            style={{
              fontSize: 88,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              textAlign: "center",
              padding: "0 80px",
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Line 2: "Hours of filming. Editing. Posting." — 10-frame breathing pause after line 1 */}
      <Sequence from={65} durationInFrames={40}>
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
              fontSize: 76,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              textAlign: "center",
              padding: "0 80px",
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Line 3: "But do you really know..." */}
      <Sequence from={110} durationInFrames={80}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 80,
          }}
        >
          <KineticText
            text="But do you really know..."
            startFrame={0}
            durationFrames={25}
            entrance={{ type: "fadeIn" }}
            style={{
              fontSize: 60,
              fontWeight: 400,
              color: TEXT_MUTED,
              textAlign: "center",
              padding: "0 80px",
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Line 4: "...what's working?" — less extreme scaleIn */}
      <Sequence from={125} durationInFrames={65}>
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 60,
          }}
        >
          <KineticText
            text="...what's working?"
            startFrame={0}
            durationFrames={25}
            exitFrame={45}
            exitDurationFrames={15}
            entrance={{ type: "scaleIn", from: 0.3, bounce: true }}
            exit={{ type: "scatter" }}
            style={{
              fontSize: 120,
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
