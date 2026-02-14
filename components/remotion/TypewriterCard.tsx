import React from "react";
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, interpolate, staticFile } from "remotion";
import { BG_BLACK, TEXT_WHITE } from "./constants";

interface TypewriterCardProps {
  line1: string;
  line2: string;
}

const FADE_IN = 10;
const GAP = 5;
const HOLD = 90;
const FADE_OUT = 15;

export const TypewriterCard: React.FC<TypewriterCardProps> = ({
  line1,
  line2,
}) => {
  const frame = useCurrentFrame();

  // ─── Timing ───
  const l1Start = FADE_IN;
  const l1End = l1Start + line1.length;
  const l2Start = l1End + GAP;
  const l2End = l2Start + line2.length;
  const holdEnd = l2End + HOLD;
  const totalFrames = holdEnd + FADE_OUT;

  // ─── Background fade in/out ───
  const fadeInOpacity = interpolate(frame, [0, FADE_IN], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOutOpacity = interpolate(frame, [holdEnd, totalFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity = Math.min(fadeInOpacity, fadeOutOpacity);

  // ─── Line 1 typewriter ───
  const l1Chars = Math.max(0, Math.min(frame - l1Start, line1.length));
  const l1Text = line1.slice(0, l1Chars);

  // ─── Line 2 typewriter ───
  const l2Chars = Math.max(0, Math.min(frame - l2Start, line2.length));
  const l2Text = line2.slice(0, l2Chars);

  // ─── Blinking cursor (visible only while typing) ───
  const isTypingL1 = frame >= l1Start && frame < l1End;
  const isTypingL2 = frame >= l2Start && frame < l2End;
  const cursorBlink = Math.floor(frame / 8) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG_BLACK,
        opacity: bgOpacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Typewriter sound during L1 typing */}
      <Sequence from={l1Start} durationInFrames={line1.length} layout="none">
        <Audio src={staticFile("keystroke.mp3")} volume={0.5} loop />
      </Sequence>
      {/* Typewriter sound during L2 typing */}
      <Sequence from={l2Start} durationInFrames={line2.length} layout="none">
        <Audio src={staticFile("keystroke.mp3")} volume={0.5} loop />
      </Sequence>

      <div style={{ textAlign: "center", maxWidth: "80%" }}>
        {/* Line 1 */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: TEXT_WHITE,
            fontFamily: "system-ui, -apple-system, sans-serif",
            lineHeight: 1.3,
            minHeight: 73,
          }}
        >
          {l1Text}
          {isTypingL1 && (
            <span style={{ opacity: cursorBlink ? 1 : 0, color: TEXT_WHITE }}>
              |
            </span>
          )}
        </div>

        {/* Line 2 */}
        {frame >= l2Start && (
          <div
            style={{
              fontSize: 44,
              fontWeight: 400,
              color: "rgba(250,250,250,0.7)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.3,
              marginTop: 16,
            }}
          >
            {l2Text}
            {isTypingL2 && (
              <span
                style={{
                  opacity: cursorBlink ? 1 : 0,
                  color: "rgba(250,250,250,0.7)",
                }}
              >
                |
              </span>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
