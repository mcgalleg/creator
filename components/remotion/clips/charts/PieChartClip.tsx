import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, CHART_COLORS, SMOOTH } from "../_shared";

interface PieChartProps {
  data: Record<string, string | number>[];
  nameKey: string;
  valueKey: string;
  title?: string;
}

const CX = 700;
const CY = 400;
const RADIUS = 280;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PieChartClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = clip.props as unknown as PieChartProps;
  const data = Array.isArray(raw.data) ? raw.data : [];
  const nameKey = raw.nameKey ?? "";
  const valueKey = raw.valueKey ?? "";
  const title = raw.title;

  if (data.length === 0) {
    return <ClipWrapper clip={clip}><AbsoluteFill style={{ backgroundColor: DARK.bg }} /></ClipWrapper>;
  }

  // Compute totals and percentages
  const total = data.reduce((sum, row) => sum + (Number(row[valueKey]) || 0), 0);
  const segments = data.map((row) => {
    const value = Number(row[valueKey]) || 0;
    return {
      name: String(row[nameKey]),
      value,
      fraction: total > 0 ? value / total : 0,
    };
  });

  // Compute cumulative delay for sequential animation
  let cumulativeDelay = 0;
  const segmentAnimations = segments.map((seg) => {
    const delay = cumulativeDelay;
    // Each segment takes proportional time, minimum 5 frame delay
    cumulativeDelay += Math.max(5, Math.round(seg.fraction * 30));
    return { ...seg, delay };
  });

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
          viewBox="0 0 1760 800"
          style={{ width: "100%", flex: 1 }}
        >
          {/* Pie segments rendered as circles with strokeDasharray */}
          {(() => {
            let offsetAccumulated = 0;

            return segmentAnimations.map((seg, i) => {
              const segmentLength = seg.fraction * CIRCUMFERENCE;
              const dashOffset = offsetAccumulated;
              offsetAccumulated += segmentLength;

              const progress = spring({
                fps,
                frame,
                config: SMOOTH,
                delay: seg.delay,
              });

              // Animated segment: reveal via strokeDashoffset
              const visibleLength = segmentLength * progress;
              const gapLength = CIRCUMFERENCE - visibleLength;

              return (
                <circle
                  key={`seg-${i}`}
                  cx={CX}
                  cy={CY}
                  r={RADIUS}
                  fill="none"
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={60}
                  strokeDasharray={`${visibleLength} ${gapLength}`}
                  strokeDashoffset={-dashOffset}
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
              );
            });
          })()}

          {/* Labels on the right side */}
          {segmentAnimations.map((seg, i) => {
            const labelY = 120 + i * 50;
            const pct = (seg.fraction * 100).toFixed(1);
            return (
              <g key={`label-${i}`}>
                <circle
                  cx={1200}
                  cy={labelY}
                  r={8}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
                <text
                  x={1220}
                  y={labelY + 5}
                  fill={DARK.foreground}
                  fontSize={18}
                  fontFamily="var(--font-sans), system-ui, sans-serif"
                >
                  {seg.name}
                </text>
                <text
                  x={1220}
                  y={labelY + 26}
                  fill={DARK.mutedFg}
                  fontSize={14}
                  fontFamily="var(--font-mono), monospace"
                >
                  {pct}%
                </text>
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
