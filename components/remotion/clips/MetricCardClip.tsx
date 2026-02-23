import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { VideoMetricCardProps } from "@/lib/video-catalog";
import { DARK, PUNCHY, countUp, formatCompact, heading32, heading48, label13, label14Mono } from "./_shared";

function formatValue(raw: number, fmt?: string): string {
  if (fmt === "percent") return `${raw.toFixed(1)}%`;
  if (fmt === "currency") return `$${formatCompact(raw)}`;
  return formatCompact(raw);
}

export function MetricCardClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as VideoMetricCardProps;
  const metrics = Array.isArray(props.metrics) ? props.metrics.slice(0, 4) : [];

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          padding: 80,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {props.title && (
          <div
            style={{
              ...heading32,
              color: DARK.foreground,
              marginBottom: 32,
            }}
          >
            {props.title}
          </div>
        )}
        <div style={{ display: "flex", gap: 24 }}>
          {metrics.map((metric, i) => {
            const delay = i * 5;
            const s = spring({ fps, frame, config: PUNCHY, delay });
            const value = countUp(
              Math.max(0, frame - delay),
              fps,
              metric.value,
              1,
            );
            const changeOpacity = spring({
              fps,
              frame,
              config: PUNCHY,
              delay: delay + fps,
            });

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: DARK.card,
                  border: `1px solid ${DARK.borderSubtle}`,
                  borderRadius: 16,
                  padding: 32,
                  opacity: s,
                  transform: `translateY(${(1 - s) * 40}px)`,
                }}
              >
                <div
                  style={{
                    ...label13,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    color: DARK.mutedFg,
                    marginBottom: 12,
                  }}
                >
                  {metric.label}
                </div>
                <div
                  style={{
                    ...heading48,
                    fontSize: 72,
                    color: DARK.foreground,
                    lineHeight: "1.1",
                  }}
                >
                  {formatValue(value, metric.format)}
                </div>
                {metric.change && (
                  <div
                    style={{
                      ...label14Mono,
                      marginTop: 12,
                      fontWeight: 600,
                      color: DARK.success,
                      opacity: changeOpacity,
                    }}
                  >
                    {metric.change}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
