"use client";

import React from "react";
import { Player } from "@remotion/player";
import { Renderer, type TimelineSpec } from "@json-render/remotion";
import { videoRegistry } from "@/lib/video-registry";
import { VideoPlayerShell } from "./VideoPlayerShell";

interface SpecPlayerInnerProps {
  spec: TimelineSpec;
}

export const SpecPlayerInner: React.FC<SpecPlayerInnerProps> = ({ spec }) => {
  const composition = spec.composition ?? { width: 1920, height: 1080, fps: 30, durationInFrames: 300 };

  return (
    <VideoPlayerShell
      renderPlayer={(ref) => (
        <Player
          ref={ref}
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
      )}
    />
  );
};
