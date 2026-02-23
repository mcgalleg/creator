import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, BOUNCY, SNAPPY, countUp, formatCompact, heading32 } from "./_shared";

interface CountUpProps {
  value: number;
  label: string;
  format?: "number" | "percent" | "currency";
  prefix?: string;
  suffix?: string;
}

function formatValue(raw: number, fmt?: string): string {
  if (fmt === "percent") return `${raw.toFixed(1)}%`;
  if (fmt === "currency") return `$${formatCompact(raw)}`;
  return formatCompact(raw);
}

export function CountUpClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as CountUpProps;

  // Number scale-in with BOUNCY spring
  const numberSpring = spring({ fps, frame, config: BOUNCY });
  const scale = 0.5 + numberSpring * 0.5;
  const opacity = numberSpring;

  // Count up over 60 frames (2 seconds at 30fps)
  const value = countUp(frame, fps, props.value ?? 0, 2);

  // Label fades in after 15 frame delay
  const labelSpring = spring({ fps, frame, config: SNAPPY, delay: 15 });

  const formatted = formatValue(value, props.format);
  const display = `${props.prefix ?? ""}${formatted}${props.suffix ?? ""}`;

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
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: DARK.foreground,
            letterSpacing: -4,
            transform: `scale(${scale})`,
            opacity,
          }}
        >
          {display}
        </div>
        <div
          style={{
            ...heading32,
            color: DARK.mutedFg,
            marginTop: 16,
            opacity: labelSpring,
            transform: `translateY(${(1 - labelSpring) * 10}px)`,
          }}
        >
          {props.label}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
