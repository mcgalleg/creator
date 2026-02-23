import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { VideoPieChartProps } from "@/lib/video-catalog";
import { DARK, CHART_COLORS, PUNCHY, heading48 } from "../_shared";

const CX = 700;
const CY = 400;
const RADIUS = 340;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Segment {
  name: string;
  value: number;
  fraction: number;
}

function computeSegmentAnimations(segments: Segment[]) {
  let cumDelay = 0;
  let cumOffset = 0;
  let cumFraction = 0;
  return segments.map((seg) => {
    const delay = cumDelay;
    const offset = cumOffset;
    const midAngle = (cumFraction + seg.fraction / 2) * 2 * Math.PI - Math.PI / 2;
    cumDelay += Math.max(5, Math.round(seg.fraction * 30));
    cumOffset += seg.fraction * CIRCUMFERENCE;
    cumFraction += seg.fraction;
    return { ...seg, delay, offset, midAngle };
  });
}

export function PieChartClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raw = clip.props as unknown as VideoPieChartProps;
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

  // Precompute cumulative delay, offset, and midAngle for each segment
  const segmentAnimations = computeSegmentAnimations(segments);

  // ...

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          padding: 48,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        {title && (
          <div
            style={{
              ...heading48,
              color: DARK.foreground,
              marginBottom: 24,
            }}
          >
            {title}
          </div>
        )}

        <svg
          viewBox="0 0 1824 880"
          style={{ width: "100%", flex: 1 }}
        >
          {/* Pie segments */}
          {segmentAnimations.map((seg, i) => {
            const segmentLength = seg.fraction * CIRCUMFERENCE;

            const progress = spring({
              fps,
              frame,
              config: PUNCHY,
              delay: seg.delay,
            });

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
                strokeDashoffset={-seg.offset}
                transform={`rotate(-90 ${CX} ${CY})`}
              />
            );
          })}

          {/* Percentage labels next to segments */}
          {segmentAnimations.map((seg, i) => {
            const labelX = CX + (RADIUS + 70) * Math.cos(seg.midAngle);
            const labelY = CY + (RADIUS + 70) * Math.sin(seg.midAngle);
            const pct = (seg.fraction * 100).toFixed(1);
            const progress = spring({
              fps,
              frame,
              config: PUNCHY,
              delay: seg.delay,
            });
            return (
              <text
                key={`pct-${i}`}
                x={labelX}
                y={labelY}
                opacity={progress}
                fill={DARK.foreground}
                fontSize={28}
                fontWeight={600}
                textAnchor="middle"
              >
                {pct}%
              </text>
            );
          })}

          {/* Labels on the right side */}
          {segmentAnimations.map((seg, i) => {
            const labelY = 120 + i * 72;
            const pct = (seg.fraction * 100).toFixed(1);
            return (
              <g key={`label-${i}`}>
                <circle
                  cx={1200}
                  cy={labelY}
                  r={10}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
                <text
                  x={1224}
                  y={labelY + 8}
                  fill={DARK.foreground}
                  fontSize={28}
                  fontWeight={600}
                  fontFamily="var(--font-sans), system-ui, sans-serif"
                >
                  {seg.name}
                </text>
                <text
                  x={1224}
                  y={labelY + 38}
                  fill={DARK.mutedFg}
                  fontSize={24}
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
