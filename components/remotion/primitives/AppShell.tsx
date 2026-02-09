"use client";

import React from "react";
import { Img, staticFile, interpolate } from "remotion";
import {
  HEADER_HEIGHT,
  CHAT_WIDTH_RATIO,
  TAB_BAR_HEIGHT,
  ACCENT,
  TEXT_PRIMARY,
  TEXT_MUTED,
  FONT_SANS,
} from "../constants";

interface AppShellProps {
  activeTab: "dashboard" | "draw";
  showNewBadge?: boolean;
  chatContent: React.ReactNode;
  viewContent: React.ReactNode;
  headerOpacity?: number;
  chatInputFocused?: boolean;
  chatInputText?: string;
  tabTransitionProgress?: number;
}

// Inline SVG icon paths
const MessageSquareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const GridIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const PencilIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const CoinsIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
  </svg>
);

const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  showNewBadge = false,
  chatContent,
  viewContent,
  headerOpacity = 1,
  chatInputFocused = false,
  chatInputText = "",
  tabTransitionProgress,
}) => {
  const borderColor = "rgba(255,255,255,0.08)";
  const panelBg = "#18181b";
  const shellBg = "#0f0f11";

  // Tab underline position: 0 = dashboard, 1 = draw
  const tabPos = tabTransitionProgress ?? (activeTab === "dashboard" ? 0 : 1);
  const underlineLeft = interpolate(tabPos, [0, 1], [0, 80]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: shellBg,
        fontFamily: FONT_SANS,
        opacity: headerOpacity,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          borderBottom: `1px solid ${borderColor}`,
          flexShrink: 0,
        }}
      >
        {/* Left: Logo */}
        <Img
          src={staticFile("logo.png")}
          style={{
            height: 24,
            objectFit: "contain",
            filter: "invert(1)",
          }}
        />
        {/* Right: badges + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <SparklesIcon />
            <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}>47</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <CoinsIcon />
            <span style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}>1000</span>
          </div>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
            }}
          />
        </div>
      </div>

      {/* Body: split pane */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Chat panel (30%) */}
        <div
          style={{
            width: `${CHAT_WIDTH_RATIO * 100}%`,
            borderRight: `1px solid ${borderColor}`,
            display: "flex",
            flexDirection: "column",
            background: panelBg,
          }}
        >
          {/* Chat header */}
          <div
            style={{
              padding: "8px 10px",
              borderBottom: `1px solid ${borderColor}`,
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <MessageSquareIcon />
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
              Analytics Assistant
            </span>
          </div>

          {/* Chat content area */}
          <div style={{ flex: 1, overflow: "hidden", padding: 8 }}>
            {chatContent}
          </div>

          {/* Chat input bar */}
          <div
            style={{
              padding: "6px 8px",
              borderTop: `1px solid ${borderColor}`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 8px",
                borderRadius: 8,
                border: chatInputFocused
                  ? `1.5px solid ${ACCENT}`
                  : `1px solid ${borderColor}`,
                boxShadow: chatInputFocused
                  ? `0 0 8px ${ACCENT}40`
                  : "none",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: chatInputText ? TEXT_PRIMARY : TEXT_MUTED,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {chatInputText || "Ask about your analytics..."}
              </span>
              <SendIcon />
            </div>
          </div>
        </div>

        {/* View panel (70%) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Tab bar */}
          <div
            style={{
              height: TAB_BAR_HEIGHT,
              display: "flex",
              alignItems: "center",
              borderBottom: `1px solid ${borderColor}`,
              position: "relative",
              flexShrink: 0,
              paddingLeft: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 12px",
                height: "100%",
                color: activeTab === "dashboard" || tabPos < 0.5 ? TEXT_PRIMARY : TEXT_MUTED,
                fontSize: 12,
                fontWeight: 500,
                cursor: "default",
              }}
            >
              <GridIcon />
              <span>Dashboard</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 12px",
                height: "100%",
                color: activeTab === "draw" || tabPos >= 0.5 ? TEXT_PRIMARY : TEXT_MUTED,
                fontSize: 12,
                fontWeight: 500,
                cursor: "default",
              }}
            >
              <PencilIcon />
              <span>Draw</span>
              {showNewBadge && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: ACCENT,
                    marginLeft: 2,
                  }}
                >
                  New
                </span>
              )}
            </div>

            {/* Active tab underline */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 8 + underlineLeft,
                width: 72,
                height: 2,
                background: ACCENT,
                borderRadius: 1,
              }}
            />
          </div>

          {/* View content */}
          <div style={{ flex: 1, overflow: "hidden", background: panelBg }}>
            {viewContent}
          </div>
        </div>
      </div>
    </div>
  );
};
