"use client";

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { AppShell } from "../primitives/AppShell";
import { MockMetricCard } from "../primitives/MockMetricCard";
import { MockAreaChart } from "../primitives/MockAreaChart";
import { SkeletonPulse } from "../primitives/SkeletonPulse";
import { TypewriterText } from "../primitives/TypewriterText";
import { MockLineChart } from "../primitives/MockLineChart";
import { CameraMove } from "../primitives/CameraMove";
import {
  ACCENT,
  TEXT_PRIMARY,
  TEXT_MUTED,
  CHART_BLUE,
  CHART_GREEN,
  CHART_AMBER,
  FONT_SANS,
  SPRING_BOUNCY,
} from "../constants";

const QUERY_TEXT = "What are my top performing videos?";

// Bot icon: small purple circle
const BotIcon: React.FC = () => (
  <div
    style={{
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: "#7c3aed",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  </div>
);

// Pencil icon for Pin to Canvas button
const PencilSmallIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const ChatContent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- User message bubble (F55+) ---
  const showUserBubble = frame >= 55;
  const userBubbleScale = showUserBubble
    ? spring({
        frame: frame - 55,
        fps,
        config: { damping: 14 },
      })
    : 0;
  const userBubbleScaleVal = interpolate(userBubbleScale, [0, 1], [0.9, 1]);

  // --- Skeleton (F70-85) ---
  const showSkeleton = frame >= 70 && frame < 85;

  // --- AI response (F85+) ---
  const showAiResponse = frame >= 85;
  const aiResponseScale = showAiResponse
    ? spring({
        frame: frame - 85,
        fps,
        config: { damping: 14 },
      })
    : 0;
  const aiScaleVal = interpolate(aiResponseScale, [0, 1], [0.95, 1]);

  // --- Pin to Canvas button (F130+) ---
  const pinOpacity = interpolate(
    frame,
    [130, 142],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Button click effect at F155
  const pinClickScale = frame >= 155
    ? spring({
        frame: frame - 155,
        fps,
        config: SPRING_BOUNCY,
      })
    : 0;
  const pinScale = frame >= 155
    ? interpolate(pinClickScale, [0, 0.5, 1], [1, 1.1, 1])
    : 1;
  const pinGlow = frame >= 155 && frame < 165
    ? interpolate(
        frame,
        [155, 160, 165],
        [0, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        height: "100%",
        fontFamily: FONT_SANS,
        overflow: "hidden",
      }}
    >
      {/* Typing indicator in chat area while typing (F10-55) */}
      {frame >= 10 && frame < 55 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        />
      )}

      {/* User message bubble */}
      {showUserBubble && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              backgroundColor: ACCENT,
              borderRadius: 12,
              padding: "8px 14px",
              maxWidth: "85%",
              transform: `scale(${userBubbleScaleVal})`,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "white",
                fontWeight: 500,
                lineHeight: 1.3,
              }}
            >
              {QUERY_TEXT}
            </span>
          </div>
        </div>
      )}

      {/* Skeleton loading */}
      {showSkeleton && (
        <div style={{ padding: "4px 0" }}>
          <SkeletonPulse lines={3} startFrame={70} />
        </div>
      )}

      {/* AI response */}
      {showAiResponse && (
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "flex-start",
            transform: `scale(${aiScaleVal})`,
            transformOrigin: "top left",
          }}
        >
          <BotIcon />
          <div
            style={{
              background: "#1e1e2e",
              borderRadius: 12,
              padding: "10px 14px",
              maxWidth: "85%",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <TypewriterText
              text="Here's your top performing content analysis:"
              startFrame={85}
              charsPerFrame={0.8}
              showCursor={false}
              style={{
                fontSize: 12,
                color: TEXT_PRIMARY,
                lineHeight: 1.4,
              }}
            />
            {frame >= 100 && (
              <div style={{ marginTop: 4 }}>
                <MockLineChart startFrame={100} durationFrames={30} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pin to Canvas button */}
      {frame >= 130 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            paddingLeft: 28,
            opacity: pinOpacity,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              border: `1px solid rgba(255,255,255,${0.15 + pinGlow * 0.5})`,
              borderRadius: 8,
              padding: "4px 10px",
              color: TEXT_MUTED,
              fontSize: 11,
              fontFamily: FONT_SANS,
              transform: `scale(${pinScale})`,
              boxShadow: pinGlow > 0
                ? `0 0 8px ${ACCENT}${Math.round(pinGlow * 80).toString(16).padStart(2, "0")}`
                : "none",
            }}
          >
            <PencilSmallIcon />
            <span>Pin to Canvas</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Static dashboard (no entrance animations - shows final state)
const StaticDashboardContent: React.FC = () => (
  <div style={{ fontFamily: FONT_SANS }}>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        padding: 16,
      }}
    >
      <MockMetricCard
        label="Followers"
        value="24.5K"
        change="+3.2%"
        changeType="up"
        startFrame={-100}
        color={CHART_BLUE}
      />
      <MockMetricCard
        label="Total Plays"
        value="142K"
        change="+12.4%"
        changeType="up"
        startFrame={-100}
        color={CHART_GREEN}
      />
      <MockMetricCard
        label="Engagement Rate"
        value="8.2%"
        change="+5.2%"
        changeType="up"
        startFrame={-100}
        color={CHART_AMBER}
      />
      <MockMetricCard
        label="Content Velocity"
        value="4.7/wk"
        startFrame={-100}
      />
    </div>
    <div style={{ padding: "0 16px", marginTop: 12 }}>
      <MockAreaChart startFrame={-200} durationFrames={80} />
    </div>
  </div>
);

export const Act5AiChat: React.FC = () => {
  const frame = useCurrentFrame();

  // Compute the typewriter text progress for the input field display
  const elapsed = Math.max(0, frame - 10);
  const charsToShow = Math.min(QUERY_TEXT.length, Math.floor(elapsed * 0.9));
  const typedText = frame >= 10 && frame < 55 ? QUERY_TEXT.slice(0, charsToShow) : "";

  return (
    <AbsoluteFill>
      <CameraMove
        keyframes={[
          // Start: normal view
          { frame: 0, scale: 1.0, translateX: 0, translateY: 0, rotateY: 1, rotateX: 1 },
          // F10: Zoom into chat input (bottom-left) to watch typing
          { frame: 10, scale: 1.5, translateX: 200, translateY: -100, rotateY: 2, rotateX: 0.5 },
          // F50: Hold on chat input through typing
          { frame: 50, scale: 1.5, translateX: 200, translateY: -100, rotateY: 2, rotateX: 0.5 },
          // F65: Quick shift up to chat response area (top of chat panel)
          { frame: 65, scale: 1.4, translateX: 180, translateY: 60, rotateY: 2, rotateX: 1 },
          // F100: Hold on response while chart renders
          { frame: 100, scale: 1.4, translateX: 180, translateY: 60, rotateY: 2, rotateX: 1 },
          // F130: Zoom back out to show full UI + pin button
          { frame: 130, scale: 1.0, translateX: 0, translateY: 0, rotateY: -2, rotateX: 1 },
          { frame: 180, scale: 1.0, translateX: -10, translateY: 0, rotateY: -1, rotateX: 0.5 },
        ]}
      >
        <AppShell
          activeTab="dashboard"
          headerOpacity={1}
          chatInputFocused={frame >= 0 && frame < 55}
          chatInputText={typedText}
          chatContent={<ChatContent />}
          viewContent={<StaticDashboardContent />}
        />
      </CameraMove>
    </AbsoluteFill>
  );
};
