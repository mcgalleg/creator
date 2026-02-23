import React from "react";
import { AbsoluteFill, Audio, Sequence, useCurrentFrame, useVideoConfig, staticFile, interpolate } from "remotion";
import { useAudioData } from "@remotion/media-utils";
import { useAudioPulse } from "./useAudioPulse";
import { AudioTrack } from "./AudioTrack";
import { BassGlow } from "./BassGlow";
import { LogoScene } from "./LogoScene";
import { CtaScene } from "./CtaScene";
import { SimulatedApp } from "./SimulatedApp";
import { AnimatedCursor } from "./AnimatedCursor";
import { TypewriterCard } from "./TypewriterCard";
import { BG_BLACK, SCENES } from "./constants";

// ─── Title card copy ───
const CARD1 = { line1: "Know exactly what's working", line2: "And why." };
const CARD2 = { line1: "Stop scrolling through dashboards", line2: "Just ask." };
const CARD3 = { line1: "Turn numbers into your next move", line2: "AI-powered strategy, visualized." };

// ─── Cursor choreography (absolute frame positions) ───
// Chat panel is 35% of 1920 = 672px. Input at bottom ~y=1010.
// Right panel starts at x=672. Tabs at top of right panel.

const CURSOR_POSITIONS = [
  // Scene 3: Dashboard (276-486) — cursor enters and hovers KPIs
  { frame: 276, x: 1920, y: 400 },        // start off-screen right
  { frame: 306, x: 1200, y: 220 },         // glide to Followers KPI
  { frame: 336, x: 1450, y: 220 },         // slide to Total Plays
  { frame: 366, x: 1300, y: 220 },         // drift between remaining KPIs
  { frame: 386, x: 1100, y: 500 },         // drift down to chart area
  { frame: 466, x: 1200, y: 600 },         // hover over chart

  // [Card 2: 486-647 — cursor hidden behind title card]

  // Scene 4a: Chat — first prompt (647+)
  { frame: 647, x: 1200, y: 600 },         // hold position (behind card)
  { frame: 675, x: 340, y: 1010 },         // glide to chat input field
  { frame: 680, x: 340, y: 1010 },         // click input
  { frame: 767, x: 380, y: 1010 },         // drift slightly during typing
  { frame: 772, x: 430, y: 1010 },         // move toward send
  { frame: 777, x: 430, y: 1010 },         // click send

  // Watch AI response
  { frame: 807, x: 300, y: 600 },          // drift up to watch AI response
  { frame: 885, x: 350, y: 700 },          // watch bar chart

  // [Card 3: 897-1080 — cursor hidden behind title card]
  { frame: 1078, x: 350, y: 700 },         // hold behind card

  // Scene 4b: Chat — second prompt (canvas trigger)
  { frame: 1083, x: 340, y: 1010 },        // glide to input
  { frame: 1086, x: 340, y: 1010 },        // click input
  { frame: 1128, x: 380, y: 1010 },        // during typing
  { frame: 1131, x: 430, y: 1010 },        // move toward send
  { frame: 1133, x: 430, y: 1010 },        // click send

  // Watch thinking dots
  { frame: 1143, x: 350, y: 700 },         // drift up
  { frame: 1153, x: 350, y: 700 },         // hold during thinking dots

  // Scene 5: Canvas (1155-1305)
  { frame: 1155, x: 350, y: 700 },         // reappear
  { frame: 1161, x: 810, y: 78 },          // glide to Draw tab
  { frame: 1166, x: 810, y: 78 },          // click Draw tab
  { frame: 1206, x: 1100, y: 400 },        // drift into canvas
  { frame: 1296, x: 1200, y: 500 },        // slowly explore canvas
];

const CURSOR_CLICK_FRAMES = [680, 777, 1086, 1133, 1166];

export const DemoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Load audio data
  const audioData = useAudioData(staticFile("music.mp3"));

  // Extract bass intensity for glow effects
  const { bassIntensity } = useAudioPulse({
    audioData,
    dataOffsetInSeconds: 0,
    frame,
    fps,
  });

  // ─── Spotlight vignette during typing ───
  // Phase 1 typing: abs 685-772 (f=38-125 in chat)
  // Phase 2 typing: abs 1083-1130 (f=436-483 in chat)
  const spot1 = interpolate(frame, [680, 692, 772, 787], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spot2 = interpolate(frame, [1083, 1093, 1130, 1143], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const spotlightOpacity = Math.max(spot1, spot2);

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BLACK }}>
      {/* Layer 1: Subtle bass glow (always present) */}
      <BassGlow bassIntensity={bassIntensity * 0.3} />

      {/* ===== Scene 1: Logo (0-50) ===== */}
      <Sequence from={SCENES.logo.start} durationInFrames={SCENES.logo.end - SCENES.logo.start}>
        <LogoScene />
      </Sequence>

      {/* ===== App UI + Cursor (206-1349) ===== */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
        }}
      >
        <Sequence from={SCENES.appReveal.start} durationInFrames={SCENES.cta.start - SCENES.appReveal.start + 40}>
          <SimulatedApp frame={frame} />
        </Sequence>

        {/* AnimatedCursor — NOT in a Sequence so useCurrentFrame() = global frame */}
        <AnimatedCursor
          positions={CURSOR_POSITIONS}
          clickFrames={CURSOR_CLICK_FRAMES}
        />
      </div>

      {/* ===== Card 1: Hook (50-206) ===== */}
      <Sequence from={SCENES.card1.start} durationInFrames={SCENES.card1.end - SCENES.card1.start}>
        <TypewriterCard line1={CARD1.line1} line2={CARD1.line2} />
      </Sequence>

      {/* ===== Card 2: AI Promise (486-647) ===== */}
      <Sequence from={SCENES.card2.start} durationInFrames={SCENES.card2.end - SCENES.card2.start}>
        <TypewriterCard line1={CARD2.line1} line2={CARD2.line2} />
      </Sequence>

      {/* ===== Spotlight vignette overlay (during typing) ===== */}
      {spotlightOpacity > 0.01 && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(ellipse 700px 400px at 340px 950px, transparent 0%, rgba(0,0,0,0.55) 100%)",
              opacity: spotlightOpacity,
            }}
          />
        </AbsoluteFill>
      )}

      {/* ===== Card 3: Strategy (897-1080) ===== */}
      <Sequence from={SCENES.card3.start} durationInFrames={SCENES.card3.end - SCENES.card3.start}>
        <TypewriterCard line1={CARD3.line1} line2={CARD3.line2} />
      </Sequence>

      {/* ===== Scene 6: CTA (1309-1549) ===== */}
      <Sequence from={SCENES.cta.start} durationInFrames={SCENES.cta.end - SCENES.cta.start}>
        <CtaScene bassIntensity={bassIntensity} />
      </Sequence>

      {/* Typewriter sounds for chat input typing */}
      <Sequence from={685} durationInFrames={87} layout="none">
        <Audio src={staticFile("keystroke.mp3")} volume={0.4} loop />
      </Sequence>
      <Sequence from={1083} durationInFrames={47} layout="none">
        <Audio src={staticFile("keystroke.mp3")} volume={0.4} loop />
      </Sequence>

      {/* Audio track (always present) */}
      <AudioTrack />
    </AbsoluteFill>
  );
};
