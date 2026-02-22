import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, BOUNCY } from "./_shared";

interface BadgeProps {
  text: string;
  variant?: string;
}

function getVariantStyles(variant?: string): {
  bg: string;
  color: string;
  border?: string;
} {
  switch (variant) {
    case "secondary":
      return { bg: DARK.muted, color: DARK.foreground };
    case "destructive":
      return { bg: "#ef4444", color: "#ffffff" };
    case "outline":
      return { bg: "transparent", color: DARK.foreground, border: `2px solid ${DARK.border}` };
    default:
      return { bg: DARK.primary, color: DARK.primaryFg };
  }
}

export function BadgeClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as BadgeProps;
  const scale = spring({ fps, frame, config: BOUNCY });
  const styles = getVariantStyles(props.variant);

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: styles.bg,
            color: styles.color,
            border: styles.border,
            fontSize: 32,
            fontWeight: 600,
            padding: "16px 48px",
            borderRadius: 9999,
            transform: `scale(${scale})`,
          }}
        >
          {props.text}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
