import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { SimulatedHeader } from "./SimulatedHeader";
import { SimulatedDashboard } from "./SimulatedDashboard";
import { SimulatedChat } from "./SimulatedChat";
import { SimulatedCanvas } from "./SimulatedCanvas";
import { DARK, TEXT_WHITE, SCENES, SPRING_SMOOTH } from "./constants";

interface SimulatedAppProps {
  frame: number;
}

// ─── Tab bar for the right panel ───
const ViewTabs: React.FC<{ activeTab: "dashboard" | "draw" }> = ({ activeTab }) => {
  const tabs: { key: "dashboard" | "draw"; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "draw", label: "Draw" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height: 44,
        borderBottom: `1px solid ${DARK.border}`,
        paddingLeft: 16,
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <div
            key={tab.key}
            style={{
              width: 110,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
              color: isActive ? TEXT_WHITE : DARK.mutedFg,
              borderBottom: isActive
                ? `2px solid ${TEXT_WHITE}`
                : "2px solid transparent",
              boxSizing: "border-box",
            }}
          >
            {tab.label}
          </div>
        );
      })}
    </div>
  );
};

export const SimulatedApp: React.FC<SimulatedAppProps> = ({ frame }) => {
  const { fps } = useVideoConfig();

  // Determine active tab based on frame
  const activeTab: "dashboard" | "draw" = frame >= SCENES.canvas.start ? "draw" : "dashboard";

  // App reveal animation: slide up + fade in
  const revealProgress = interpolate(
    frame,
    [SCENES.appReveal.start, SCENES.appReveal.start + 40],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const slideY = interpolate(revealProgress, [0, 1], [40, 0]);
  const fadeIn = revealProgress;

  // App exit animation: scale down + fade out
  const exitOpacity = interpolate(
    frame,
    [SCENES.cta.start, SCENES.cta.start + 40],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const exitScale = interpolate(
    frame,
    [SCENES.cta.start, SCENES.cta.start + 40],
    [1, 0.95],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const opacity = fadeIn * exitOpacity;
  const scale = exitScale;

  // ─── Chat scene camera zoom ───
  // Smoothly zoom into the chat panel during the chat scene for readability.
  // Pins left edge + bottom edge so the typing input and latest messages stay visible.
  const CHAT_ZOOM_SCALE = 1.25;
  const chatZoomInStart = SCENES.chat.start + 15;
  const chatZoomOutStart = SCENES.canvas.start - 45;

  let chatZoomProgress: number;
  if (frame < chatZoomInStart) {
    chatZoomProgress = 0;
  } else if (frame < chatZoomOutStart) {
    chatZoomProgress = spring({
      frame: frame - chatZoomInStart,
      fps,
      config: SPRING_SMOOTH,
    });
  } else {
    chatZoomProgress = 1 - spring({
      frame: frame - chatZoomOutStart,
      fps,
      config: SPRING_SMOOTH,
    });
  }

  const chatZoom = 1 + chatZoomProgress * (CHAT_ZOOM_SCALE - 1);
  // Translate to pin left edge (push right) and bottom edge (push up)
  const chatTx = 960 * (chatZoom - 1);
  const chatTy = 540 * (1 - chatZoom);

  // Cross-fade between dashboard and canvas
  const canvasOpacity = interpolate(
    frame,
    [SCENES.canvas.start, SCENES.canvas.start + 40],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const dashboardOpacity = interpolate(
    frame,
    [SCENES.canvas.start, SCENES.canvas.start + 40],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1920,
        height: 1080,
        opacity,
        transform: `translate(${chatTx}px, ${slideY + chatTy}px) scale(${scale * chatZoom})`,
        transformOrigin: "center center",
        display: "flex",
        flexDirection: "column",
        backgroundColor: DARK.bg,
        overflow: "hidden",
        borderRadius: 16,
      }}
    >
      {/* Header bar */}
      <SimulatedHeader />

      {/* Content area: chat (left) | tabs + dashboard/canvas (right) */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left panel: Chat */}
        <div
          style={{
            width: "35%",
            borderRight: `1px solid ${DARK.border}`,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <SimulatedChat frame={frame} sceneStartFrame={SCENES.chat.start} />
        </div>

        {/* Right panel: Tabs + content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Tab bar at top of right panel */}
          <ViewTabs activeTab={activeTab} />

          {/* Content below tabs */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {/* Dashboard view */}
            {frame < SCENES.cta.start && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: dashboardOpacity,
                }}
              >
                <SimulatedDashboard
                  frame={frame}
                  animationStartFrame={SCENES.dashboard.start}
                />
              </div>
            )}

            {/* Canvas view (cross-fades in) */}
            {frame >= SCENES.canvas.start && frame < SCENES.cta.start && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: canvasOpacity,
                }}
              >
                <SimulatedCanvas frame={frame} enterFrame={SCENES.canvas.start + 20} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
