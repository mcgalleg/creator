import type { Point } from "./paths";

export interface YScale {
  min: number;
  max: number;
  ticks: number[];
}

/** Compute Y scale from data and yKeys */
export function computeYScale(
  data: Record<string, string | number>[],
  yKeys: string[],
  tickCount = 5,
): YScale {
  let min = Infinity;
  let max = -Infinity;
  for (const row of data) {
    for (const key of yKeys) {
      const v = Number(row[key]);
      if (!isNaN(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
  }
  if (!isFinite(min)) min = 0;
  if (!isFinite(max)) max = 100;
  if (min === max) {
    max = min + 1;
  }

  // Nice tick spacing
  const range = max - min;
  const step = range / (tickCount - 1);
  const ticks: number[] = [];
  for (let i = 0; i < tickCount; i++) {
    ticks.push(Math.round((min + step * i) * 100) / 100);
  }

  return { min, max, ticks };
}

/** Map a value to a Y pixel coordinate */
export function mapToY(
  value: number,
  scale: YScale,
  height: number,
  padding = 20,
): number {
  const usable = height - padding * 2;
  const ratio = (value - scale.min) / (scale.max - scale.min);
  return height - padding - ratio * usable;
}

/** Convert data to pixel points for a given yKey */
export function dataToPoints(
  data: Record<string, string | number>[],
  xKey: string,
  yKey: string,
  width: number,
  height: number,
  scale: YScale,
  paddingX = 60,
  paddingY = 20,
): Point[] {
  const usableW = width - paddingX * 2;
  const count = data.length;
  if (count === 0) return [];

  return data.map((row, i) => ({
    x: paddingX + (count > 1 ? (i / (count - 1)) * usableW : usableW / 2),
    y: mapToY(Number(row[yKey]) || 0, scale, height, paddingY),
  }));
}
