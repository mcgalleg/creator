import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, SMOOTH, countUp, formatCompact } from "./_shared";

interface MetricDef {
  label: string;
  value: number;
  format?: string;
  change?: string;
}

interface MetricCardProps {
  metrics: MetricDef[];
  title?: string;
}

function formatValue(raw: number, fmt?: string): string {
  if (fmt === "percent") return `${raw.toFixed(1)}%`;
  if (fmt === "currency") return `$${formatCompact(raw)}`;
  return formatCompact(raw);
}

export function MetricCardClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as MetricCardProps;
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
              fontSize: 36,
              fontWeight: 700,
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
            const s = spring({ fps, frame, config: SMOOTH, delay });
            const value = countUp(
              Math.max(0, frame - delay),
              fps,
              metric.value,
              1,
            );
            const changeOpacity = spring({
              fps,
              frame,
              config: SMOOTH,
              delay: delay + fps,
            });

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: DARK.card,
                  borderRadius: 16,
                  padding: 32,
                  opacity: s,
                  transform: `translateY(${(1 - s) * 20}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
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
                    fontSize: 56,
                    fontWeight: 700,
                    color: DARK.foreground,
                    lineHeight: 1.1,
                  }}
                >
                  {formatValue(value, metric.format)}
                </div>
                {metric.change && (
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 18,
                      fontWeight: 600,
                      color: DARK.green,
                      fontFamily: "var(--font-mono), monospace",
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
