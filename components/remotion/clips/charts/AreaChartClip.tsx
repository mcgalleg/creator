import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { evolvePath } from "@remotion/paths";
import {
  DARK,
  CHART_COLORS,
  SMOOTH,
  clampedInterpolate,
  computeYScale,
  mapToY,
  dataToPoints,
  buildSmoothPath,
  buildAreaPath,
  formatCompact,
} from "../_shared";

interface AreaChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  yKeys: string[];
  title?: string;
  gradient?: boolean;
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

export function AreaChartClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = clip.props as unknown as AreaChartProps;
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
          <defs>
            {yKeys.map((_, si) => (
              <linearGradient
                key={`grad-${si}`}
                id={`area-grad-${si}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={CHART_COLORS[si % CHART_COLORS.length]}
                  stopOpacity={0.6}
                />
                <stop
                  offset="100%"
                  stopColor={CHART_COLORS[si % CHART_COLORS.length]}
                  stopOpacity={0.05}
                />
              </linearGradient>
            ))}
          </defs>

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

          {/* X-axis labels */}
          {data.map((row, i) => {
            const count = data.length;
            const x =
              CHART_LEFT +
              (count > 1
                ? (i / (count - 1)) * CHART_W
                : CHART_W / 2);
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
                {String(row[xKey])}
              </text>
            );
          })}

          {/* Area fills + Lines */}
          {yKeys.map((yKey, si) => {
            const points = dataToPoints(
              data,
              xKey,
              yKey,
              CHART_W,
              CHART_H,
              scale,
              0,
              0,
            ).map((p) => ({ x: p.x + CHART_LEFT, y: p.y + CHART_TOP }));

            const linePathD = buildSmoothPath(points);
            const areaPathD = buildAreaPath(points, CHART_BOTTOM);
            if (!linePathD) return null;

            const progress = spring({
              fps,
              frame,
              config: SMOOTH,
              delay: si * 10,
            });

            const evolved = evolvePath(progress, linePathD);

            // Area opacity fades in alongside the line draw
            const startFrame = si * 10;
            const areaOpacity = clampedInterpolate(
              frame,
              [startFrame, startFrame + 40],
              [0, 0.3],
            );

            return (
              <g key={`series-${si}`}>
                {/* Area fill */}
                <path
                  d={areaPathD}
                  fill={`url(#area-grad-${si})`}
                  opacity={areaOpacity}
                />
                {/* Line */}
                <path
                  d={linePathD}
                  fill="none"
                  stroke={CHART_COLORS[si % CHART_COLORS.length]}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={evolved.strokeDasharray}
                  strokeDashoffset={evolved.strokeDashoffset}
                />
              </g>
            );
          })}

          {/* Legend */}
          {yKeys.length > 1 &&
            yKeys.map((key, i) => (
              <g key={`legend-${i}`}>
                <circle
                  cx={CHART_RIGHT - 150}
                  cy={CHART_TOP + i * 24}
                  r={5}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
                <text
                  x={CHART_RIGHT - 138}
                  y={CHART_TOP + i * 24 + 5}
                  fill={DARK.mutedFg}
                  fontSize={14}
                  fontFamily="var(--font-mono), monospace"
                >
                  {key}
                </text>
              </g>
            ))}
        </svg>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
