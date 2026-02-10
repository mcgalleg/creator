import { useCallback } from "react";
import { Audio } from "@remotion/media";
import { staticFile, interpolate } from "remotion";
import { TOTAL_DURATION_FRAMES } from "./constants";

export const AudioTrack: React.FC = () => {
  const volumeFn = useCallback((frame: number) => {
    return interpolate(
      frame,
      [0, 15, TOTAL_DURATION_FRAMES - 15, TOTAL_DURATION_FRAMES],
      [0, 0.5, 0.5, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  }, []);

  return <Audio src={staticFile("music.mp3")} volume={volumeFn} />;
};
