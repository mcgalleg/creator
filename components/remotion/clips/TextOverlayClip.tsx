import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, SNAPPY } from "./_shared";

interface TextOverlayProps {
  text: string;
  position?: "top" | "center" | "bottom";
  fontSize?: "small" | "medium" | "large";
}

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  top: { top: 80, left: 0, right: 0 },
  center: { top: "50%", left: 0, right: 0, transform: "translateY(-50%)" },
  bottom: { bottom: 80, left: 0, right: 0 },
};

const FONT_SIZES: Record<string, number> = {
  small: 32,
  medium: 48,
  large: 72,
};

export function TextOverlayClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as TextOverlayProps;

  const fadeIn = spring({ fps, frame, config: SNAPPY });
  const pos = props.position || "center";
  const size = FONT_SIZES[props.fontSize || "medium"];

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            ...POSITION_STYLES[pos],
            textAlign: "center",
            color: DARK.foreground,
            fontSize: size,
            fontWeight: 600,
            fontFamily: "var(--font-sans), system-ui, sans-serif",
            letterSpacing: size >= 72 ? "-2px" : size >= 48 ? "-1px" : "0",
            padding: "0 60px",
            textShadow: "0 2px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)",
            opacity: fadeIn,
          }}
        >
          {props.text}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
