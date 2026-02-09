"use client";

import dynamic from "next/dynamic";

const PlayerInner = dynamic(() => import("./PlayerInner"), { ssr: false });

interface TutorialPlayerProps {
  className?: string;
}

export function TutorialPlayer({ className }: TutorialPlayerProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        backgroundColor: "#0f0f11",
        overflow: "hidden",
      }}
    >
      <PlayerInner />
    </div>
  );
}
