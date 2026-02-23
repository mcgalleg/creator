import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { evolvePath } from "@remotion/paths";
import type { VideoLineChartProps } from "@/lib/video-catalog";
import {
  DARK,
  CHART_COLORS,
  PUNCHY,
  computeYScale,
  dataToPoints,
  buildSmoothPath,
  CHART_LEFT,
  CHART_TOP,
  CHART_W,
  CHART_H,
  ChartGridLines,
  ChartXAxisLabels,
  ChartLegend,
  ChartLayout,
} from "../_shared";

export function LineChartClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = clip.props as unknown as VideoLineChartProps;
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
        <ChartGridLines scale={scale} />
        <ChartXAxisLabels data={data} xKey={xKey} />

        {/* Lines */}
        {yKeys.map((yKey, si) => {
          const points = dataToPoints(
            data, xKey, yKey, CHART_W, CHART_H, scale, 0, 0,
          ).map((p) => ({ x: p.x + CHART_LEFT, y: p.y + CHART_TOP }));

          const pathD = buildSmoothPath(points);
          if (!pathD) return null;

          const progress = spring({ fps, frame, config: PUNCHY, delay: si * 10 });
          const evolved = evolvePath(progress, pathD);
          const lastPoint = points[points.length - 1];

          return (
            <g key={`line-${si}`}>
              <path
                d={pathD}
                fill="none"
                stroke={CHART_COLORS[si % CHART_COLORS.length]}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={evolved.strokeDasharray}
                strokeDashoffset={evolved.strokeDashoffset}
              />
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r={8}
                fill={CHART_COLORS[si % CHART_COLORS.length]}
                opacity={progress}
                stroke={DARK.bg}
                strokeWidth={3}
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
