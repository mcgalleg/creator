import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { VideoBarChartProps } from "@/lib/video-catalog";
import {
  DARK,
  CHART_COLORS,
  PUNCHY,
  computeYScale,
  mapToY,
  formatCompact,
  CHART_LEFT,
  CHART_TOP,
  CHART_BOTTOM,
  CHART_W,
  CHART_H,
  ChartGridLines,
  ChartLegend,
  ChartLayout,
} from "../_shared";

export function BarChartClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = clip.props as unknown as VideoBarChartProps;
  const data = Array.isArray(raw.data) ? raw.data : [];
  const xKey = raw.xKey ?? "";
  const yKeys = Array.isArray(raw.yKeys) ? raw.yKeys : [];
  const title = raw.title;

  if (data.length === 0 || yKeys.length === 0) {
    return <ClipWrapper clip={clip}><AbsoluteFill style={{ backgroundColor: DARK.bg }} /></ClipWrapper>;
  }

  const scale = computeYScale(data, yKeys);
  const barGroupCount = data.length;
  const seriesCount = yKeys.length;

  const groupWidth = CHART_W / barGroupCount;
  const barGap = 4;
  const barWidth =
    seriesCount > 1
      ? (groupWidth * 0.7 - barGap * (seriesCount - 1)) / seriesCount
      : groupWidth * 0.65;

  return (
    <ClipWrapper clip={clip}>
      <ChartLayout title={title}>
        <ChartGridLines scale={scale} />

        {/* X-axis labels + Bars */}
        {data.map((row, di) => {
          const groupX = CHART_LEFT + di * groupWidth + groupWidth / 2;
          const label = String(row[xKey]);

          return (
            <g key={`bar-group-${di}`}>
              <text
                x={groupX}
                y={CHART_BOTTOM + 36}
                textAnchor="middle"
                fill={DARK.mutedFg}
                fontSize={26}
                fontFamily="var(--font-sans), system-ui, sans-serif"
              >
                {label}
              </text>

              {yKeys.map((yKey, si) => {
                const value = Number(row[yKey]) || 0;
                const barY = mapToY(value, scale, CHART_H, 0) + CHART_TOP;
                const fullHeight = CHART_BOTTOM - barY;

                const progress = spring({
                  fps,
                  frame,
                  config: PUNCHY,
                  delay: di * 5 + si * 2,
                });

                const animatedHeight = fullHeight * progress;
                const animatedY = CHART_BOTTOM - animatedHeight;

                const offsetX =
                  seriesCount > 1
                    ? (si - (seriesCount - 1) / 2) * (barWidth + barGap)
                    : 0;

                return (
                  <g key={`bar-${di}-${si}`}>
                    <rect
                      x={groupX + offsetX - barWidth / 2}
                      y={animatedY}
                      width={barWidth}
                      height={Math.max(0, animatedHeight)}
                      rx={4}
                      fill={CHART_COLORS[si % CHART_COLORS.length]}
                    />
                    <text
                      x={groupX + offsetX}
                      y={animatedY - 8}
                      opacity={progress}
                      fill={DARK.foreground}
                      fontSize={24}
                      fontWeight={600}
                      fontFamily="var(--font-sans), system-ui, sans-serif"
                      textAnchor="middle"
                    >
                      {formatCompact(value)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        <ChartLegend
          items={yKeys.map((key, i) => ({
            label: key,
            color: CHART_COLORS[i % CHART_COLORS.length],
          }))}
        />
      </ChartLayout>
    </ClipWrapper>
  );
}
