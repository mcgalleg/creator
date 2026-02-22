import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import {
  DARK,
  CHART_COLORS,
  SMOOTH,
  computeYScale,
  mapToY,
  formatCompact,
} from "../_shared";

interface BarChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  yKeys: string[];
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

export function BarChartClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = clip.props as unknown as BarChartProps;
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

  // spacing
  const groupWidth = CHART_W / barGroupCount;
  const barGap = 4;
  const barWidth =
    seriesCount > 1
      ? (groupWidth * 0.7 - barGap * (seriesCount - 1)) / seriesCount
      : groupWidth * 0.5;

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
          {/* Horizontal grid lines */}
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

          {/* X-axis labels + Bars */}
          {data.map((row, di) => {
            const groupX =
              CHART_LEFT + di * groupWidth + groupWidth / 2;
            const label = String(row[xKey]);

            return (
              <g key={`bar-group-${di}`}>
                {/* X-axis label */}
                <text
                  x={groupX}
                  y={CHART_BOTTOM + 28}
                  textAnchor="middle"
                  fill={DARK.mutedFg}
                  fontSize={14}
                  fontFamily="var(--font-mono), monospace"
                >
                  {label}
                </text>

                {/* Bars for each series */}
                {yKeys.map((yKey, si) => {
                  const value = Number(row[yKey]) || 0;
                  const barY = mapToY(value, scale, CHART_H, 0) + CHART_TOP;
                  const fullHeight = CHART_BOTTOM - barY;

                  const progress = spring({
                    fps,
                    frame,
                    config: SMOOTH,
                    delay: di * 5 + si * 2,
                  });

                  const animatedHeight = fullHeight * progress;
                  const animatedY = CHART_BOTTOM - animatedHeight;

                  const offsetX =
                    seriesCount > 1
                      ? (si - (seriesCount - 1) / 2) *
                        (barWidth + barGap)
                      : 0;

                  return (
                    <rect
                      key={`bar-${di}-${si}`}
                      x={groupX + offsetX - barWidth / 2}
                      y={animatedY}
                      width={barWidth}
                      height={Math.max(0, animatedHeight)}
                      rx={4}
                      fill={CHART_COLORS[si % CHART_COLORS.length]}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Legend (multiple series) */}
          {seriesCount > 1 &&
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
