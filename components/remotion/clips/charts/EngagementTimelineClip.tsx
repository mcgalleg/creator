import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { evolvePath } from "@remotion/paths";
import {
  DARK,
  CHART_COLORS,
  SMOOTH,
  computeYScale,
  mapToY,
  dataToPoints,
  buildSmoothPath,
  formatCompact,
} from "../_shared";

interface EngagementTimelineProps {
  data: { date: string; likes: number; comments: number; shares: number; plays: number }[];
  title?: string;
}

const SVG_W = 1760;
const SVG_H = 800;
const PAD_X = 80;
const PAD_Y = 40;
const CHART_LEFT = PAD_X;
const CHART_RIGHT = SVG_W - PAD_X;
const CHART_TOP = PAD_Y;
const CHART_BOTTOM = SVG_H - PAD_Y;
const CHART_W = CHART_RIGHT - CHART_LEFT;
const CHART_H = CHART_BOTTOM - CHART_TOP;

const SERIES: { key: string; label: string; colorIndex: number }[] = [
  { key: "likes", label: "Likes", colorIndex: 0 },
  { key: "comments", label: "Comments", colorIndex: 1 },
  { key: "shares", label: "Shares", colorIndex: 2 },
  { key: "plays", label: "Plays", colorIndex: 3 },
];

export function EngagementTimelineClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = clip.props as unknown as EngagementTimelineProps;
  const data = Array.isArray(raw.data) ? raw.data : [];
  const title = raw.title;

  if (data.length === 0) {
    return <ClipWrapper clip={clip}><AbsoluteFill style={{ backgroundColor: DARK.bg }} /></ClipWrapper>;
  }

  const yKeys = SERIES.map((s) => s.key);
  const scale = computeYScale(data as Record<string, string | number>[], yKeys);

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          padding: 80,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        {title && (
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: DARK.foreground,
              marginBottom: 24,
            }}
          >
            {title}
          </div>
        )}

        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: "100%", flex: 1 }}
        >
          {/* Horizontal grid lines + Y labels */}
          {scale.ticks.map((tick, i) => {
            const y = mapToY(tick, scale, CHART_H, 0) + CHART_TOP;
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={CHART_LEFT}
                  y1={y}
                  x2={CHART_RIGHT}
                  y2={y}
                  stroke={DARK.border}
                  strokeWidth={1}
                />
                <text
                  x={CHART_LEFT - 12}
                  y={y + 4}
                  textAnchor="end"
                  fill={DARK.mutedFg}
                  fontSize={14}
                  fontFamily="var(--font-mono), monospace"
                >
                  {formatCompact(tick)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels (dates) */}
          {data.map((row, i) => {
            const count = data.length;
            const x =
              CHART_LEFT +
              (count > 1
                ? (i / (count - 1)) * CHART_W
                : CHART_W / 2);
            // Only show every few labels to avoid overlap
            const showLabel =
              count <= 10 || i % Math.ceil(count / 8) === 0 || i === count - 1;
            if (!showLabel) return null;
            return (
              <text
                key={`x-${i}`}
                x={x}
                y={CHART_BOTTOM + 28}
                textAnchor="middle"
                fill={DARK.mutedFg}
                fontSize={14}
                fontFamily="var(--font-mono), monospace"
              >
                {row.date}
              </text>
            );
          })}

          {/* Lines for each series */}
          {SERIES.map((series, si) => {
            const points = dataToPoints(
              data as Record<string, string | number>[],
              "date",
              series.key,
              CHART_W,
              CHART_H,
              scale,
              0,
              0,
            ).map((p) => ({ x: p.x + CHART_LEFT, y: p.y + CHART_TOP }));

            const pathD = buildSmoothPath(points);
            if (!pathD) return null;

            const progress = spring({
              fps,
              frame,
              config: SMOOTH,
              delay: si * 10,
            });

            const evolved = evolvePath(progress, pathD);

            return (
              <path
                key={`line-${si}`}
                d={pathD}
                fill="none"
                stroke={CHART_COLORS[series.colorIndex]}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={evolved.strokeDasharray}
                strokeDashoffset={evolved.strokeDashoffset}
              />
            );
          })}

          {/* Legend */}
          {SERIES.map((series, i) => (
            <g key={`legend-${i}`}>
              <circle
                cx={CHART_RIGHT - 150}
                cy={CHART_TOP + i * 24}
                r={5}
                fill={CHART_COLORS[series.colorIndex]}
              />
              <text
                x={CHART_RIGHT - 138}
                y={CHART_TOP + i * 24 + 5}
                fill={DARK.mutedFg}
                fontSize={14}
                fontFamily="var(--font-mono), monospace"
              >
                {series.label}
              </text>
            </g>
          ))}
        </svg>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
