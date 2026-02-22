import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, SNAPPY } from "./_shared";

interface AlertProps {
  title?: string;
  description: string;
  variant?: string;
}

export function AlertClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as AlertProps;
  const s = spring({ fps, frame, config: SNAPPY });
  const borderColor =
    props.variant === "destructive" ? "#ef4444" : DARK.chart1;

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          padding: 80,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: DARK.card,
            borderRadius: 16,
            padding: 32,
            borderLeft: `4px solid ${borderColor}`,
            maxWidth: 800,
            width: "100%",
            opacity: s,
            transform: `translateX(${(1 - s) * -100}px)`,
          }}
        >
          {props.title && (
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: DARK.foreground,
                marginBottom: 8,
              }}
            >
              {props.title}
            </div>
          )}
          <div
            style={{
              fontSize: 20,
              color: DARK.mutedFg,
              lineHeight: 1.5,
            }}
          >
            {props.description}
          </div>
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
