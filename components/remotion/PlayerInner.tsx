"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { DemoVideo } from "./DemoVideo";
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, TOTAL_FRAMES } from "./constants";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

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
  const [playing, setPlaying] = useState(true);
  const [showPauseIcon, setShowPauseIcon] = useState(false);

  // Force-mute on mount (belt-and-suspenders with initiallyMuted) and keep
  // the React icon in sync with the Player's actual mute state via the
  // volumechange event. This prevents the icon showing "muted" while audio
  // plays — which can happen when initiallyMuted doesn't reliably take
  // effect across reloads.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    player.mute();

    const syncMuted = () => {
      if (playerRef.current) {
        setMuted(playerRef.current.isMuted());
      }
    };

    player.addEventListener("volumechange", syncMuted);

    const syncPlaying = () => {
      if (playerRef.current) {
        setPlaying(playerRef.current.isPlaying());
      }
    };
    player.addEventListener("play", syncPlaying);
    player.addEventListener("pause", syncPlaying);

    return () => {
      player.removeEventListener("volumechange", syncMuted);
      player.removeEventListener("play", syncPlaying);
      player.removeEventListener("pause", syncPlaying);
    };
  }, []);

  const toggleMute = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const player = playerRef.current;
      if (!player) return;

      if (muted) {
        player.unmute();
        player.setVolume(1);
      } else {
        player.mute();
      }
      // State is synced by the volumechange listener above, but set it
      // eagerly here too for immediate UI feedback.
      setMuted(!muted);
    },
    [muted],
  );

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (!player.isPlaying()) {
      player.play();
    } else {
      player.pause();
    }
    setShowPauseIcon(true);
    setTimeout(() => setShowPauseIcon(false), 600);
  }, []);

  return (
    <div
      style={{ position: "relative", width: "100%", cursor: playing ? "none" : "pointer" }}
      onClick={togglePlay}
    >
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
        clickToPlay={false}
        style={{ width: "100%", pointerEvents: "none" }}
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
      {/* Play/Pause indicator */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          opacity: showPauseIcon ? 1 : 0,
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
          {playing ? <Play size={28} /> : <Pause size={28} />}
        </div>
      </div>
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
