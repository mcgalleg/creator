import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, PUNCHY, SNAPPY, countUp, formatCompact, heading48, label16 } from "./_shared";

interface ComparisonProps {
  leftLabel: string;
  leftValue: number;
  rightLabel: string;
  rightValue: number;
  format?: "number" | "percent" | "currency";
  title?: string;
}

function formatValue(raw: number, fmt?: string): string {
  if (fmt === "percent") return `${raw.toFixed(1)}%`;
  if (fmt === "currency") return `$${formatCompact(raw)}`;
  return formatCompact(raw);
}

export function ComparisonClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as ComparisonProps;

  // Left side slides in from left
  const leftSpring = spring({ fps, frame, config: PUNCHY });
  const leftX = (1 - leftSpring) * -60;

  // Divider grows from 0 to 100%
  const dividerSpring = spring({ fps, frame, config: SNAPPY, delay: 10 });

  // Right side slides in from right with delay
  const rightSpring = spring({ fps, frame, config: PUNCHY, delay: 15 });
  const rightX = (1 - rightSpring) * 60;

  // Count up values over 2 seconds
  const leftValue = countUp(frame, fps, props.leftValue ?? 0, 2);
  const rightValue = countUp(Math.max(0, frame - 15), fps, props.rightValue ?? 0, 2);

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        {props.title && (
          <div
            style={{
              ...heading48,
              color: DARK.foreground,
              marginBottom: 64,
            }}
          >
            {props.title}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            gap: 64,
          }}
        >
          {/* Left side */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: leftSpring,
              transform: `translateX(${leftX}px)`,
            }}
          >
            <div style={{ ...label16, color: DARK.mutedFg, marginBottom: 16 }}>
              {props.leftLabel}
            </div>
            <div
              style={{
                fontSize: 120,
                fontWeight: 700,
                color: DARK.foreground,
                letterSpacing: -4,
              }}
            >
              {formatValue(leftValue, props.format)}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: 2,
              height: 200,
              backgroundColor: DARK.border,
              transform: `scaleY(${dividerSpring})`,
              transformOrigin: "center",
            }}
          />

          {/* Right side */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: rightSpring,
              transform: `translateX(${rightX}px)`,
            }}
          >
            <div style={{ ...label16, color: DARK.mutedFg, marginBottom: 16 }}>
              {props.rightLabel}
            </div>
            <div
              style={{
                fontSize: 120,
                fontWeight: 700,
                color: DARK.foreground,
                letterSpacing: -4,
              }}
            >
              {formatValue(rightValue, props.format)}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
