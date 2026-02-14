import { visualizeAudio } from "@remotion/media-utils";
import type { AudioData } from "@remotion/media-utils";

type AudioPulseInput = {
  audioData: AudioData | null;
  dataOffsetInSeconds: number;
  frame: number;
  fps: number;
};

type AudioPulseOutput = {
  bassIntensity: number;
  midIntensity: number;
  frequencies: number[];
};

export function useAudioPulse({ audioData, dataOffsetInSeconds, frame, fps }: AudioPulseInput): AudioPulseOutput {
  if (!audioData) {
    return { bassIntensity: 0, midIntensity: 0, frequencies: [] };
  }

  const frequencies = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 128,
    optimizeFor: "speed",
    dataOffsetInSeconds,
  });

  const bassSlice = frequencies.slice(0, 32);
  const midSlice = frequencies.slice(32, 64);

  const bassIntensity = bassSlice.reduce((sum, v) => sum + v, 0) / bassSlice.length;
  const midIntensity = midSlice.reduce((sum, v) => sum + v, 0) / midSlice.length;

  return { bassIntensity, midIntensity, frequencies };
}
