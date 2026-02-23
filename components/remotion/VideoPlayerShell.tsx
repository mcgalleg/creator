"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerRef } from "@remotion/player";
import { Pause, Play } from "lucide-react";

// =============================================================================
// Error Boundary
// =============================================================================

class PlayerErrorBoundary extends React.Component<
  { children: React.ReactNode; bgColor?: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; bgColor?: string }) {
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
            backgroundColor: this.props.bgColor ?? "#1a1a1a",
            borderRadius: 12,
          }}
        />
      );
    }
    return this.props.children;
  }
}

// =============================================================================
// VideoPlayerShell
// =============================================================================

interface VideoPlayerShellProps {
  /** Render the <Player> component — receives a ref to attach */
  renderPlayer: (ref: React.RefObject<PlayerRef | null>) => React.ReactNode;
  /** Background color for error fallback */
  bgColor?: string;
  /** Additional controls to render */
  controls?: React.ReactNode;
  /** Callback fired once the player ref is available */
  onPlayerRef?: (ref: React.RefObject<PlayerRef | null>) => void;
}

export function VideoPlayerShell({ renderPlayer, bgColor, controls, onPlayerRef }: VideoPlayerShellProps) {
  const playerRef = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(false);
  const [showActionIcon, setShowActionIcon] = useState(false);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    onPlayerRef?.(playerRef);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    // Sync initial state via microtask to avoid synchronous setState in effect
    queueMicrotask(() => {
      if (playerRef.current?.isPlaying()) setPlaying(true);
    });
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (!player.isPlaying()) player.play();
    else player.pause();
    setShowActionIcon(true);
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => setShowActionIcon(false), 600);
  }, []);

  return (
    <PlayerErrorBoundary bgColor={bgColor}>
      <div
        style={{ position: "relative", width: "100%", cursor: "pointer", borderRadius: 12, overflow: "hidden" }}
        onClick={togglePlay}
      >
        {renderPlayer(playerRef)}

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

        {controls}
      </div>
    </PlayerErrorBoundary>
  );
}
