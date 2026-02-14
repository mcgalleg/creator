import React from "react";
import { DARK, TEXT_WHITE } from "./constants";

export const SimulatedHeader: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 56,
        backgroundColor: DARK.bg,
        paddingLeft: 20,
        paddingRight: 20,
        borderBottom: `1px solid ${DARK.border}`,
        flexShrink: 0,
      }}
    >
      {/* Left section: logo + separator + user */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Logo */}
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: TEXT_WHITE,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
          }}
        >
          Creator
        </span>

        {/* Vertical separator */}
        <div
          style={{
            width: 1,
            height: 20,
            backgroundColor: DARK.border,
          }}
        />

        {/* Avatar + username */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: DARK.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: DARK.mutedFg,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            S
          </div>
          <span
            style={{
              fontSize: 14,
              color: DARK.mutedFg,
              fontFamily: "var(--font-sans), system-ui, sans-serif",
            }}
          >
            @sarah_creates
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right section: badges + gear + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* AI tokens badge */}
        <div
          style={{
            backgroundColor: DARK.muted,
            borderRadius: 9999,
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 4,
            paddingBottom: 4,
            fontSize: 12,
            color: DARK.mutedFg,
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          100K
        </div>

        {/* Credits badge */}
        <div
          style={{
            backgroundColor: DARK.muted,
            borderRadius: 9999,
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 4,
            paddingBottom: 4,
            fontSize: 12,
            color: DARK.mutedFg,
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          250
        </div>

        {/* Settings gear */}
        <span
          style={{
            fontSize: 18,
            color: DARK.mutedFg,
          }}
        >
          &#x2699;
        </span>

        {/* User avatar */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: DARK.chart1,
          }}
        />
      </div>
    </div>
  );
};
