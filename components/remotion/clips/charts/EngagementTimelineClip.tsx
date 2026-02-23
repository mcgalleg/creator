import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { evolvePath } from "@remotion/paths";
import type { VideoEngagementTimelineProps } from "@/lib/video-catalog";
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

const SERIES: { key: string; label: string; colorIndex: number }[] = [
  { key: "likes", label: "Likes", colorIndex: 0 },
  { key: "comments", label: "Comments", colorIndex: 1 },
  { key: "shares", label: "Shares", colorIndex: 2 },
  { key: "plays", label: "Plays", colorIndex: 3 },
];

export function EngagementTimelineClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = clip.props as unknown as VideoEngagementTimelineProps;
  const data = Array.isArray(raw.data) ? raw.data : [];
  const title = raw.title;

  if (data.length === 0) {
    return <ClipWrapper clip={clip}><AbsoluteFill style={{ backgroundColor: DARK.bg }} /></ClipWrapper>;
  }

  const yKeys = SERIES.map((s) => s.key);
  const scale = computeYScale(data as Record<string, string | number>[], yKeys);

  return (
    <ClipWrapper clip={clip}>
      <ChartLayout title={title}>
        <ChartGridLines scale={scale} />
        <ChartXAxisLabels
          data={data as Record<string, string | number>[]}
          xKey="date"
          maxLabels={8}
        />

        {/* Lines for each series */}
        {SERIES.map((series, si) => {
          const points = dataToPoints(
            data as Record<string, string | number>[],
            "date", series.key, CHART_W, CHART_H, scale, 0, 0,
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
                stroke={CHART_COLORS[series.colorIndex]}
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
                fill={CHART_COLORS[series.colorIndex]}
                opacity={progress}
                stroke={DARK.bg}
                strokeWidth={3}
              />
            </g>
          );
        })}

        <ChartLegend
          items={SERIES.map((s) => ({
            label: s.label,
            color: CHART_COLORS[s.colorIndex],
          }))}
        />
      </ChartLayout>
    </ClipWrapper>
  );
}
