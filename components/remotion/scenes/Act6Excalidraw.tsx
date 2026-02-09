"use client";

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { AppShell } from "../primitives/AppShell";
import { MockExcalidrawCanvas } from "../primitives/MockExcalidrawCanvas";
import { CameraMove } from "../primitives/CameraMove";
import {
  ACCENT,
  TEXT_MUTED,
  FONT_SANS,
  EXCALIDRAW_BLUE,
  EXCALIDRAW_GREEN,
  EXCALIDRAW_AMBER,
  EXCALIDRAW_RED,
} from "../constants";

const DRAW_PROMPT = "create: draw me an engagement plan";

const FLOWCHART_ELEMENTS = [
  { type: "rect" as const, x: 160, y: 30, w: 160, h: 50, label: "Content Strategy", fill: EXCALIDRAW_BLUE },
  { type: "arrow" as const, x1: 240, y1: 80, x2: 240, y2: 110 },
  { type: "rect" as const, x: 120, y: 110, w: 240, h: 45, label: "Post Mon/Wed/Fri 6PM", fill: EXCALIDRAW_GREEN },
  { type: "arrow" as const, x1: 360, y1: 132, x2: 400, y2: 132 },
  { type: "rect" as const, x: 400, y: 110, w: 260, h: 45, label: "Top Topics: Cooking, Travel", fill: EXCALIDRAW_AMBER },
  { type: "diamond" as const, x: 180, y: 180, w: 140, h: 70, label: "Engage > 8%?", fill: "#f5f5f5" },
  { type: "arrow" as const, x1: 130, y1: 215, x2: 60, y2: 260, label: "No" },
  { type: "arrow" as const, x1: 320, y1: 215, x2: 390, y2: 260, label: "Yes" },
  { type: "rect" as const, x: 350, y: 260, w: 130, h: 40, label: "Scale Up", fill: EXCALIDRAW_GREEN },
  { type: "rect" as const, x: 10, y: 260, w: 140, h: 40, label: "Pivot Topic", fill: EXCALIDRAW_RED },
];

// Frame ranges for each element's draw animation (shifted +30 for prompt typing)
const ELEMENT_TIMING: Array<[number, number]> = [
  [55, 80],   // 0: Content Strategy rect
  [80, 92],   // 1: arrow down
  [92, 118],  // 2: Post schedule box
  [118, 135], // 3: arrow right
  [135, 162], // 4: Top Topics box
  [162, 182], // 5: diamond decision
  [182, 196], // 6: No arrow
  [196, 210], // 7: Yes arrow
  [210, 235], // 8: Scale Up box
  [235, 260], // 9: Pivot Topic box
];

// Determine visibleUpTo and drawProgress from frame
function getDrawState(frame: number): { visibleUpTo: number; drawProgress: number } {
  let visibleUpTo = -1;
  let drawProgress = 0;

  for (let i = 0; i < ELEMENT_TIMING.length; i++) {
    const [start, end] = ELEMENT_TIMING[i];
    if (frame >= end) {
      visibleUpTo = i;
      drawProgress = 1;
    } else if (frame >= start) {
      visibleUpTo = i;
      drawProgress = interpolate(frame, [start, end], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      break;
    } else {
      break;
    }
  }

  return { visibleUpTo, drawProgress };
}

export const Act6Excalidraw: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Prompt typing (F0-30) ---
  const promptElapsed = Math.max(0, frame - 2);
  const promptCharsToShow = Math.min(DRAW_PROMPT.length, Math.floor(promptElapsed * 1.2));
  const promptTypedText = frame >= 2 && frame < 35 ? DRAW_PROMPT.slice(0, promptCharsToShow) : "";

  // User message bubble appears after typing (F35+)
  const showPromptBubble = frame >= 35;
  const promptBubbleScale = showPromptBubble
    ? spring({ frame: frame - 35, fps, config: { damping: 14 } })
    : 0;
  const promptBubbleScaleVal = interpolate(promptBubbleScale, [0, 1], [0.9, 1]);

  // Tab transition: Dashboard -> Draw (F35-45) — delayed to happen after prompt
  const tabTransitionProgress = interpolate(
    frame,
    [35, 45],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Canvas crossfade (F40-50) — after prompt bubble appears
  const canvasOpacity = interpolate(
    frame,
    [40, 50],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Drawing selector header (F45-55)
  const selectorOpacity = interpolate(
    frame,
    [45, 55],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Glow pulse on completed flowchart (F260-280)
  const glowIntensity = interpolate(
    frame,
    [260, 270, 280],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const { visibleUpTo, drawProgress } = getDrawState(frame);

  // Chat content: prompt typing then user bubble
  const chatContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%", justifyContent: "flex-end" }}>
      {/* User message bubble after typing completes */}
      {showPromptBubble && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              backgroundColor: ACCENT,
              borderRadius: 12,
              padding: "8px 14px",
              maxWidth: "90%",
              transform: `scale(${promptBubbleScaleVal})`,
              transformOrigin: "bottom right",
            }}
          >
            <span style={{ fontSize: 12, color: "white", fontWeight: 500, lineHeight: 1.3 }}>
              {/* Highlight "draw me" and "engagement plan" */}
              <span>create: </span>
              <span style={{ fontWeight: 700, textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.5)" }}>draw me</span>
              <span> an </span>
              <span style={{ fontWeight: 700, textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.5)" }}>engagement plan</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // View content: Excalidraw canvas with drawing selector
  const viewContent = (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Dashboard content fading out */}
      {frame < 50 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 1 - canvasOpacity,
            background: "#18181b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 12, color: TEXT_MUTED }}>Dashboard</span>
        </div>
      )}

      {/* Excalidraw canvas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: canvasOpacity,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Drawing selector header */}
        <div
          style={{
            height: 32,
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            background: "#fafafa",
            opacity: selectorOpacity,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #e0e0e0",
              background: "#fff",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#333", fontFamily: FONT_SANS }}>
              Engagement Plan
            </span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            boxShadow: glowIntensity > 0
              ? `inset 0 0 ${20 * glowIntensity}px rgba(245, 158, 11, ${0.15 * glowIntensity})`
              : "none",
          }}
        >
          <MockExcalidrawCanvas
            elements={FLOWCHART_ELEMENTS}
            visibleUpTo={visibleUpTo}
            drawProgress={drawProgress}
          />
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill>
      <CameraMove
        keyframes={[
          // F0: Zoom into chat panel to see prompt typing
          { frame: 0, rotateX: 0.5, rotateY: 1, scale: 1.4, translateX: 190, translateY: -80 },
          // F30: Hold on chat to see the prompt bubble
          { frame: 30, scale: 1.4, translateX: 190, translateY: -80, rotateY: 1.5, rotateX: 0.5 },
          // F50: Quick shift to canvas area to watch diagram draw
          { frame: 50, scale: 1.05, translateX: -30, translateY: 0, rotateY: -1, rotateX: 1 },
          // F120: Gentle drift while drawing continues
          { frame: 120, rotateX: 1.5, rotateY: -2, scale: 1.03, translateX: -20, translateY: -10 },
          // F200: Slow drift as bottom elements draw
          { frame: 200, rotateX: 1, rotateY: 1, scale: 1.02, translateX: 10, translateY: -5 },
          // F270: Settle to overview after glow
          { frame: 280, rotateX: 0.5, rotateY: 0.5, scale: 1.01, translateX: 0, translateY: 0 },
          // F320: Rest
          { frame: 320, rotateX: 0, rotateY: 0, scale: 1.0, translateX: 0, translateY: 0 },
        ]}
      >
        <AppShell
          activeTab="draw"
          showNewBadge={true}
          chatInputFocused={frame >= 0 && frame < 35}
          chatInputText={promptTypedText}
          chatContent={chatContent}
          viewContent={viewContent}
          tabTransitionProgress={tabTransitionProgress}
        />
      </CameraMove>
    </AbsoluteFill>
  );
};
