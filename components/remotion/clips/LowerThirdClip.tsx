import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, SNAPPY, heading24, label16 } from "./_shared";

interface LowerThirdProps {
  name: string;
  title?: string;
  backgroundColor?: string;
}

export function LowerThirdClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as LowerThirdProps;

  const slideIn = spring({ fps, frame, config: SNAPPY });
  const titleFade = spring({ fps, frame, config: SNAPPY, delay: 8 });

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 60,
            backgroundColor: props.backgroundColor || "rgba(10,10,10,0.85)",
            backdropFilter: "blur(12px)",
            color: DARK.foreground,
            padding: "20px 32px",
            borderRadius: 12,
            border: `1px solid ${DARK.borderSubtle}`,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            opacity: slideIn,
            transform: `translateY(${(1 - slideIn) * 20}px)`,
          }}
        >
          <div style={{ ...heading24, color: DARK.foreground }}>
            {props.name}
          </div>
          {props.title && (
            <div
              style={{
                ...label16,
                color: DARK.mutedFg,
                marginTop: 4,
                opacity: titleFade,
              }}
            >
              {props.title}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
