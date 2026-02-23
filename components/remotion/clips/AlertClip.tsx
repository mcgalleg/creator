import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { VideoAlertProps } from "@/lib/video-catalog";
import { DARK, SNAPPY, heading24, copy18 } from "./_shared";

export function AlertClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as VideoAlertProps;
  const s = spring({ fps, frame, config: SNAPPY });
  const borderColor =
    props.variant === "destructive" ? DARK.error : DARK.info;

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
            border: `1px solid ${DARK.borderSubtle}`,
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
                ...heading24,
                color: DARK.foreground,
                marginBottom: 8,
              }}
            >
              {props.title}
            </div>
          )}
          <div
            style={{
              ...copy18,
              color: DARK.mutedFg,
            }}
          >
            {props.description}
          </div>
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
