import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { VideoProgressProps } from "@/lib/video-catalog";
import { DARK, clampedInterpolate, countUp, heading24, heading32 } from "./_shared";

export function ProgressClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as VideoProgressProps;
  const fillWidth = clampedInterpolate(frame, [0, fps], [0, props.value]);
  const displayValue = countUp(frame, fps, props.value, 1);

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          padding: 80,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {props.label && (
          <div
            style={{
              ...heading24,
              color: DARK.mutedFg,
              marginBottom: 16,
              alignSelf: "flex-start",
            }}
          >
            {props.label}
          </div>
        )}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 24,
              borderRadius: 12,
              backgroundColor: DARK.muted,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${fillWidth}%`,
                height: "100%",
                borderRadius: 12,
                background: `linear-gradient(90deg, ${DARK.chart1}, ${DARK.chart2})`,
              }}
            />
          </div>
          <div
            style={{
              ...heading32,
              color: DARK.foreground,
              fontFamily: "var(--font-mono), monospace",
              minWidth: 80,
              textAlign: "right",
            }}
          >
            {Math.round(displayValue)}%
          </div>
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
