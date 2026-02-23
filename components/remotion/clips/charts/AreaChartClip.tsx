import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { evolvePath } from "@remotion/paths";
import type { VideoAreaChartProps } from "@/lib/video-catalog";
import {
  DARK,
  CHART_COLORS,
  PUNCHY,
  clampedInterpolate,
  computeYScale,
  dataToPoints,
  buildSmoothPath,
  buildAreaPath,
  CHART_LEFT,
  CHART_TOP,
  CHART_BOTTOM,
  CHART_W,
  CHART_H,
  ChartGridLines,
  ChartXAxisLabels,
  ChartLegend,
  ChartLayout,
} from "../_shared";

export function AreaChartClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = clip.props as unknown as VideoAreaChartProps;
  const data = Array.isArray(raw.data) ? raw.data : [];
  const xKey = raw.xKey ?? "";
  const yKeys = Array.isArray(raw.yKeys) ? raw.yKeys : [];
  const title = raw.title;

  if (data.length === 0 || yKeys.length === 0) {
    return <ClipWrapper clip={clip}><AbsoluteFill style={{ backgroundColor: DARK.bg }} /></ClipWrapper>;
  }

  const scale = computeYScale(data, yKeys);

  return (
    <ClipWrapper clip={clip}>
      <ChartLayout title={title}>
        <defs>
          {yKeys.map((_, si) => (
            <linearGradient
              key={`grad-${si}`}
              id={`area-grad-${si}`}
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop
                offset="0%"
                stopColor={CHART_COLORS[si % CHART_COLORS.length]}
                stopOpacity={0.8}
              />
              <stop
                offset="100%"
                stopColor={CHART_COLORS[si % CHART_COLORS.length]}
                stopOpacity={0.05}
              />
            </linearGradient>
          ))}
        </defs>

        <ChartGridLines scale={scale} />
        <ChartXAxisLabels data={data} xKey={xKey} />

        {/* Area fills + Lines */}
        {yKeys.map((yKey, si) => {
          const points = dataToPoints(
            data, xKey, yKey, CHART_W, CHART_H, scale, 0, 0,
          ).map((p) => ({ x: p.x + CHART_LEFT, y: p.y + CHART_TOP }));

          const linePathD = buildSmoothPath(points);
          const areaPathD = buildAreaPath(points, CHART_BOTTOM);
          if (!linePathD) return null;

          const progress = spring({ fps, frame, config: PUNCHY, delay: si * 10 });
          const evolved = evolvePath(progress, linePathD);

          const startFrame = si * 10;
          const areaOpacity = clampedInterpolate(
            frame,
            [startFrame, startFrame + 40],
            [0, 0.3],
          );

          return (
            <g key={`series-${si}`}>
              <path
                d={areaPathD}
                fill={`url(#area-grad-${si})`}
                opacity={areaOpacity}
              />
              <path
                d={linePathD}
                fill="none"
                stroke={CHART_COLORS[si % CHART_COLORS.length]}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={evolved.strokeDasharray}
                strokeDashoffset={evolved.strokeDashoffset}
              />
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
