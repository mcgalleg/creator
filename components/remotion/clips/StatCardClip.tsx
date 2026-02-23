import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, BOUNCY, SNAPPY, countUp, formatCompact, heading32 } from "./_shared";

interface StatCardProps {
  value: string | number;
  label: string;
  prefix?: string;
  suffix?: string;
  backgroundColor?: string;
}

export function StatCardClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as StatCardProps;

  const valueSpring = spring({ fps, frame, config: BOUNCY });
  const scale = 0.5 + valueSpring * 0.5;

  const labelSpring = spring({ fps, frame, config: SNAPPY, delay: 12 });

  const numValue = typeof props.value === "number"
    ? props.value
    : parseFloat(props.value) || 0;
  const isNumeric = typeof props.value === "number" || !isNaN(parseFloat(props.value));
  const displayValue = isNumeric
    ? formatCompact(countUp(frame, fps, numValue, 1.5))
    : props.value;

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: props.backgroundColor || DARK.bg,
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
            opacity: valueSpring,
          }}
        >
          {props.prefix || ""}
          {displayValue}
          {props.suffix || ""}
        </div>
        <div
          style={{
            ...heading32,
            color: DARK.mutedFg,
            fontWeight: 400,
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
