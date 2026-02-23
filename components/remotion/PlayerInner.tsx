"use client";

import React, { useCallback, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { DemoVideo } from "./DemoVideo";
import { VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, TOTAL_FRAMES } from "./constants";
import { Volume2, VolumeX } from "lucide-react";
import { VideoPlayerShell } from "./VideoPlayerShell";

export const PlayerInner: React.FC = () => {
  const playerRefCapture = useRef<PlayerRef | null>(null);
  const [muted, setMuted] = useState(true);

  const handlePlayerRef = useCallback((ref: React.RefObject<PlayerRef | null>) => {
    playerRefCapture.current = ref.current;
    const player = ref.current;
    if (!player) return;
    player.mute();
    const syncMuted = () => {
      if (ref.current) setMuted(ref.current.isMuted());
    };
    player.addEventListener("volumechange", syncMuted);
  }, []);

  const toggleMute = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const player = playerRefCapture.current;
      if (!player) return;
      if (muted) {
        player.unmute();
        player.setVolume(1);
      } else {
        player.mute();
      }
      setMuted(!muted);
    },
    [muted],
  );

  return (
    <VideoPlayerShell
      bgColor="#000"
      onPlayerRef={handlePlayerRef}
      renderPlayer={(ref) => (
        <Player
          ref={ref}
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
            <div style={{ width: "100%", height: "100%", backgroundColor: "#000" }} />
          )}
        />
      )}
      controls={
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
      }
    />
  );
};
