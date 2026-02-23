import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, PUNCHY, heading48, heading24 } from "./_shared";

interface TitleCardProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function TitleCardClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as TitleCardProps;

  const titleSpring = spring({ fps, frame, config: PUNCHY });
  const subtitleSpring = spring({ fps, frame, config: PUNCHY, delay: 10 });

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: props.backgroundColor || DARK.bg,
          color: props.textColor || DARK.foreground,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        <div
          style={{
            ...heading48,
            fontSize: 80,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: "88px",
            opacity: titleSpring,
            transform: `translateY(${(1 - titleSpring) * 30}px)`,
          }}
        >
          {props.title}
        </div>
        {props.subtitle && (
          <div
            style={{
              ...heading24,
              fontWeight: 400,
              color: DARK.mutedFg,
              textAlign: "center",
              marginTop: 24,
              opacity: subtitleSpring,
              transform: `translateY(${(1 - subtitleSpring) * 20}px)`,
            }}
          >
            {props.subtitle}
          </div>
        )}
      </AbsoluteFill>
    </ClipWrapper>
  );
}
