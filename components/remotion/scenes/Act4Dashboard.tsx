"use client";

import React from "react";
import { AbsoluteFill } from "remotion";
import { AppShell } from "../primitives/AppShell";
import { MockMetricCard } from "../primitives/MockMetricCard";
import { MockAreaChart } from "../primitives/MockAreaChart";
import { CameraMove } from "../primitives/CameraMove";
import {
  TEXT_MUTED,
  CHART_BLUE,
  CHART_GREEN,
  CHART_AMBER,
  FONT_SANS,
} from "../constants";

const ChatEmptyState: React.FC = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      gap: 6,
    }}
  >
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke={TEXT_MUTED}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
    <span
      style={{
        fontSize: 13,
        color: TEXT_MUTED,
        fontFamily: FONT_SANS,
        fontWeight: 500,
      }}
    >
      Ask me about your analytics!
    </span>
    <span
      style={{
        fontSize: 11,
        color: TEXT_MUTED,
        fontFamily: FONT_SANS,
        opacity: 0.6,
      }}
    >
      Try: &quot;What are my top videos?&quot;
    </span>
  </div>
);

const DashboardContent: React.FC = () => (
  <div style={{ fontFamily: FONT_SANS }}>
    {/* Metric cards in 2x2 grid */}
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
        startFrame={5}
        color={CHART_BLUE}
      />
      <MockMetricCard
        label="Total Plays"
        value="142K"
        change="+12.4%"
        changeType="up"
        startFrame={15}
        color={CHART_GREEN}
      />
      <MockMetricCard
        label="Engagement Rate"
        value="8.2%"
        change="+5.2%"
        changeType="up"
        startFrame={25}
        color={CHART_AMBER}
      />
      <MockMetricCard
        label="Content Velocity"
        value="4.7/wk"
        startFrame={35}
      />
    </div>

    {/* Area chart */}
    <div style={{ padding: "0 16px", marginTop: 12 }}>
      <MockAreaChart startFrame={50} durationFrames={80} />
    </div>
  </div>
);

export const Act4Dashboard: React.FC = () => {
  return (
    <AbsoluteFill>
      <CameraMove
        keyframes={[
          { frame: 0, rotateX: 2, rotateY: 3, scale: 1.02, translateX: -10, translateY: -5 },
          { frame: 90, rotateX: 1, rotateY: -2, scale: 1.0, translateX: 10, translateY: 5 },
          { frame: 180, rotateX: 1.5, rotateY: 1, scale: 1.01, translateX: 0, translateY: 0 },
        ]}
      >
        <AppShell
          activeTab="dashboard"
          headerOpacity={1}
          chatContent={<ChatEmptyState />}
          viewContent={<DashboardContent />}
        />
      </CameraMove>
    </AbsoluteFill>
  );
};
