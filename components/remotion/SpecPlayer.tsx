"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { TimelineSpec } from "@json-render/remotion";

const SpecPlayerInner = dynamic(
  () => import("./SpecPlayerInner").then((m) => ({ default: m.SpecPlayerInner })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          backgroundColor: "#1a1a1a",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.5)",
          fontSize: 14,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Loading player...
      </div>
    ),
  }
);

interface SpecPlayerProps {
  // Accept VideoSpec from the hook (broader type) — cast to TimelineSpec internally
  spec: Record<string, unknown>;
}

export function SpecPlayer({ spec }: SpecPlayerProps) {
  return <SpecPlayerInner spec={spec as TimelineSpec} />;
}
