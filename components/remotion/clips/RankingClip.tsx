import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import {
  DARK,
  CHART_COLORS,
  PUNCHY,
  countUp,
  formatCompact,
  heading48,
  heading20,
  label14Mono,
} from "./_shared";

interface RankingItem {
  label: string;
  value: number;
}

interface RankingProps {
  items: RankingItem[];
  title?: string;
  format?: "number" | "percent" | "currency";
}

function formatValue(raw: number, fmt?: string): string {
  if (fmt === "percent") return `${raw.toFixed(1)}%`;
  if (fmt === "currency") return `$${formatCompact(raw)}`;
  return formatCompact(raw);
}

export function RankingClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as RankingProps;

  const items = Array.isArray(props.items)
    ? [...props.items].sort((a, b) => b.value - a.value).slice(0, 8)
    : [];
  const maxValue = items.length > 0 ? Math.max(...items.map((d) => d.value)) : 1;

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          padding: 80,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {props.title && (
          <div
            style={{
              ...heading48,
              color: DARK.foreground,
              marginBottom: 48,
            }}
          >
            {props.title}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, i) => {
            const delay = i * 8;
            const s = spring({ fps, frame, config: PUNCHY, delay });
            const barWidth = (item.value / maxValue) * 100;
            const value = countUp(Math.max(0, frame - delay), fps, item.value, 1.5);
            const color = CHART_COLORS[i % CHART_COLORS.length];

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 48,
                  opacity: s,
                }}
              >
                {/* Label */}
                <div
                  style={{
                    ...heading20,
                    color: DARK.foreground,
                    width: 200,
                    flexShrink: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </div>

                {/* Bar */}
                <div
                  style={{
                    flex: 1,
                    height: 48,
                    position: "relative",
                    marginLeft: 16,
                    marginRight: 16,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barWidth * s}%`,
                      backgroundColor: color,
                      borderRadius: 8,
                    }}
                  />
                </div>

                {/* Value */}
                <div
                  style={{
                    ...label14Mono,
                    color: DARK.foreground,
                    width: 120,
                    flexShrink: 0,
                    textAlign: "right",
                  }}
                >
                  {formatValue(value, props.format)}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
