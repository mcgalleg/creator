import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, BOUNCY, SNAPPY, heading32, label16 } from "./_shared";

interface CalloutProps {
  value: string;
  label: string;
  sublabel?: string;
}

export function CalloutClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as CalloutProps;

  // Value scales in with BOUNCY spring
  const valueSpring = spring({ fps, frame, config: BOUNCY });
  const scale = 0.5 + valueSpring * 0.5;

  // Label fades in with delay
  const labelSpring = spring({ fps, frame, config: SNAPPY, delay: 10 });

  // Sublabel fades in with more delay
  const sublabelSpring = spring({ fps, frame, config: SNAPPY, delay: 20 });

  // Pulsing glow opacity using sine wave
  const glowOpacity = 0.4 + 0.2 * Math.sin(frame * 0.1);

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
        {/* Radial gradient glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
            opacity: glowOpacity,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        {/* Value */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: DARK.foreground,
            transform: `scale(${scale})`,
            opacity: valueSpring,
            position: "relative",
          }}
        >
          {props.value}
        </div>

        {/* Label */}
        <div
          style={{
            ...heading32,
            color: DARK.mutedFg,
            opacity: labelSpring,
            transform: `translateY(${(1 - labelSpring) * 10}px)`,
            position: "relative",
          }}
        >
          {props.label}
        </div>

        {/* Sublabel */}
        {props.sublabel && (
          <div
            style={{
              ...label16,
              color: DARK.mutedFg,
              marginTop: 8,
              opacity: sublabelSpring,
              transform: `translateY(${(1 - sublabelSpring) * 10}px)`,
              position: "relative",
            }}
          >
            {props.sublabel}
          </div>
        )}
      </AbsoluteFill>
    </ClipWrapper>
  );
}
