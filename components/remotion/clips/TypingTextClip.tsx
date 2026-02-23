import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { DARK } from "./_shared";

interface TypingTextProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: "monospace" | "sans-serif" | "serif";
  showCursor?: boolean;
  cursorChar?: string;
  charsPerSecond?: number;
}

const FONT_FAMILY_MAP: Record<string, string> = {
  monospace: "var(--font-mono), 'Geist Mono', 'Courier New', Consolas, monospace",
  "sans-serif": "var(--font-sans), 'Geist', system-ui, -apple-system, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};

export function TypingTextClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const {
    text,
    backgroundColor,
    textColor,
    fontSize,
    fontFamily,
    showCursor = true,
    cursorChar = "|",
    charsPerSecond = 15,
  } = clip.props as unknown as TypingTextProps;

  const framesPerChar = fps / charsPerSecond;
  const charsToShow = Math.min(Math.floor(frame / framesPerChar), text.length);
  const displayedText = text.slice(0, charsToShow);
  const isTypingComplete = charsToShow >= text.length;
  const cursorBlink = Math.floor(frame / (fps / 2)) % 2 === 0;
  const cursorVisible = showCursor && (cursorBlink || !isTypingComplete);

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: backgroundColor || DARK.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            color: textColor || DARK.foreground,
            fontSize: fontSize || 64,
            fontFamily: FONT_FAMILY_MAP[fontFamily || "monospace"],
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxWidth: "90%",
            textAlign: "left",
            lineHeight: 1.4,
          }}
        >
          {displayedText}
          {cursorVisible && (
            <span
              style={{
                opacity: isTypingComplete ? (cursorBlink ? 1 : 0) : 1,
                color: DARK.mutedFg,
              }}
            >
              {cursorChar}
            </span>
          )}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
