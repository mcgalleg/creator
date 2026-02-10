"use client";

import { useRef, useState, useCallback } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { PromoVideo } from "./PromoVideo";
import {
  TOTAL_DURATION_FRAMES,
  COMP_WIDTH,
  COMP_HEIGHT,
  FPS,
} from "./constants";

export default function PlayerInner() {
  const playerRef = useRef<PlayerRef>(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unmute();
      player.play(e);
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <Player
        ref={playerRef}
        component={PromoVideo}
        durationInFrames={TOTAL_DURATION_FRAMES}
        compositionWidth={COMP_WIDTH}
        compositionHeight={COMP_HEIGHT}
        fps={FPS}
        loop
        autoPlay
        initiallyMuted
        controls={false}
        style={{
          width: "100%",
          overflow: "hidden",
        }}
      />
      <button
        onClickCapture={toggleMute}
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(0, 0, 0, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          color: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>
    </div>
  );
}
