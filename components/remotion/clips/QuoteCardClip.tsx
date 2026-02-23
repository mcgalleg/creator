import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, PUNCHY, SNAPPY, heading24 } from "./_shared";

interface QuoteCardProps {
  quote: string;
  author?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function QuoteCardClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as QuoteCardProps;

  const quoteSpring = spring({ fps, frame, config: PUNCHY });
  const authorSpring = spring({ fps, frame, config: SNAPPY, delay: 15 });

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
          padding: 120,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        }}
      >
        {/* Decorative quote mark */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: DARK.chart1,
            opacity: 0.3,
            lineHeight: "1",
            marginBottom: -20,
            alignSelf: "flex-start",
          }}
        >
          {"\u201C"}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 500,
            fontStyle: "italic",
            textAlign: "center",
            lineHeight: "64px",
            letterSpacing: "-1px",
            opacity: quoteSpring,
            transform: `translateY(${(1 - quoteSpring) * 20}px)`,
          }}
        >
          {props.quote}
        </div>
        {props.author && (
          <div
            style={{
              ...heading24,
              fontWeight: 400,
              color: DARK.mutedFg,
              marginTop: 32,
              opacity: authorSpring,
              transform: `translateY(${(1 - authorSpring) * 10}px)`,
            }}
          >
            {"— "}
            {props.author}
          </div>
        )}
      </AbsoluteFill>
    </ClipWrapper>
  );
}
