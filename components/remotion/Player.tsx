"use client";

import dynamic from "next/dynamic";
import React from "react";

const PlayerInner = dynamic(
  () => import("./PlayerInner").then((m) => ({ default: m.PlayerInner })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          backgroundColor: "#000",
        }}
      />
    ),
  }
);

export function TutorialPlayer() {
  return <PlayerInner />;
}
