import { interpolate } from "remotion";

/** Clamped interpolate — enforces clamping by default */
export function clampedInterpolate(
  frame: number,
  input: [number, number],
  output: [number, number],
): number {
  return interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Count-up: animates a number from 0 to target over durationSec */
export function countUp(
  frame: number,
  fps: number,
  target: number,
  durationSec = 1,
): number {
  const safeTarget = Number(target) || 0;
  return interpolate(frame, [0, durationSec * fps], [0, safeTarget], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
