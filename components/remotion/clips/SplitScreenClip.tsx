import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, PUNCHY, heading48 } from "./_shared";

interface SplitScreenProps {
  leftTitle: string;
  rightTitle: string;
  leftColor?: string;
  rightColor?: string;
}

export function SplitScreenClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as SplitScreenProps;

  const leftSpring = spring({ fps, frame, config: PUNCHY });
  const rightSpring = spring({ fps, frame, config: PUNCHY, delay: 10 });
  const dividerSpring = spring({ fps, frame, config: PUNCHY, delay: 5 });

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "row",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        {/* Left panel */}
        <div
          style={{
            flex: 1,
            backgroundColor: props.leftColor || DARK.surfaceElevated,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 60,
          }}
        >
          <div
            style={{
              ...heading48,
              color: DARK.foreground,
              textAlign: "center",
              opacity: leftSpring,
              transform: `translateX(${(1 - leftSpring) * -40}px)`,
            }}
          >
            {props.leftTitle}
          </div>
        </div>

        {/* Center divider */}
        <div
          style={{
            width: 2,
            backgroundColor: DARK.borderDefault,
            transform: `scaleY(${dividerSpring})`,
            transformOrigin: "center",
          }}
        />

        {/* Right panel */}
        <div
          style={{
            flex: 1,
            backgroundColor: props.rightColor || DARK.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 60,
          }}
        >
          <div
            style={{
              ...heading48,
              color: DARK.foreground,
              textAlign: "center",
              opacity: rightSpring,
              transform: `translateX(${(1 - rightSpring) * 40}px)`,
            }}
          >
            {props.rightTitle}
          </div>
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
