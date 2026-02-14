"use client";

import React, { useCallback, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { DemoVideo } from "./DemoVideo";
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, TOTAL_FRAMES } from "./constants";
import { Volume2, VolumeX } from "lucide-react";

class PlayerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: "100%",
            aspectRatio: "16/9",
            backgroundColor: "#000",
          }}
        />
      );
    }
    return this.props.children;
  }
}

const PlayerContent: React.FC = () => {
  const playerRef = useRef<PlayerRef>(null);
  const [muted, setMuted] = useState(true);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unmute();
      player.setVolume(1);
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", cursor: "none" }}>
      <Player
        ref={playerRef}
        component={DemoVideo}
        compositionWidth={VIDEO_WIDTH}
        compositionHeight={VIDEO_HEIGHT}
        fps={VIDEO_FPS}
        durationInFrames={TOTAL_FRAMES}
        autoPlay
        loop
        initiallyMuted
        style={{ width: "100%" }}
        errorFallback={() => (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#000",
            }}
          />
        )}
      />
      <button
        onClick={toggleMute}
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.2)",
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          color: "#FAFAFA",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
          padding: 0,
        }}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
};

export const PlayerInner: React.FC = () => {
  return (
    <PlayerErrorBoundary>
      <PlayerContent />
    </PlayerErrorBoundary>
  );
};
