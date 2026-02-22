"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Renderer, type TimelineSpec } from "@json-render/remotion";
import { videoRegistry } from "@/lib/video-registry";
import { Pause, Play } from "lucide-react";

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
        <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "#1a1a1a", borderRadius: 12 }} />
      );
    }
    return this.props.children;
  }
}

interface SpecPlayerInnerProps {
  spec: TimelineSpec;
}

const SpecPlayerContent: React.FC<SpecPlayerInnerProps> = ({ spec }) => {
  const playerRef = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(false);
  const [showActionIcon, setShowActionIcon] = useState(false);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    // Sync initial state — autoPlay may have already started
    if (player.isPlaying()) setPlaying(true);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (!player.isPlaying()) player.play();
    else player.pause();
    // Flash the action icon briefly
    setShowActionIcon(true);
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => setShowActionIcon(false), 600);
  }, []);

  const composition = spec.composition ?? { width: 1920, height: 1080, fps: 30, durationInFrames: 300 };

  return (
    <div
      style={{ position: "relative", width: "100%", cursor: "pointer", borderRadius: 12, overflow: "hidden" }}
      onClick={togglePlay}
    >
      <Player
        ref={playerRef}
        component={Renderer}
        inputProps={{ spec, components: videoRegistry }}
        compositionWidth={composition.width ?? 1920}
        compositionHeight={composition.height ?? 1080}
        fps={composition.fps ?? 30}
        durationInFrames={composition.durationInFrames ?? 300}
        loop
        autoPlay
        clickToPlay={false}
        style={{ width: "100%", pointerEvents: "none" }}
        errorFallback={() => (
          <div style={{ width: "100%", height: "100%", backgroundColor: "#1a1a1a" }} />
        )}
      />
      {/* Persistent play button when paused */}
      {!playing && !showActionIcon && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FAFAFA",
            }}
          >
            <Play size={32} style={{ marginLeft: 4 }} />
          </div>
        </div>
      )}
      {/* Brief action icon flash on toggle */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          opacity: showActionIcon ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FAFAFA",
          }}
        >
          {playing ? <Pause size={28} /> : <Play size={28} />}
        </div>
      </div>
    </div>
  );
};

export const SpecPlayerInner: React.FC<SpecPlayerInnerProps> = ({ spec }) => {
  return (
    <PlayerErrorBoundary>
      <SpecPlayerContent spec={spec} />
    </PlayerErrorBoundary>
  );
};
