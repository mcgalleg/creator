import { ClipWrapper, type Clip } from "@json-render/remotion";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { Highlight, type PrismTheme } from "prism-react-renderer";
import type { VideoCodeBlockProps } from "@/lib/video-catalog";
import { DARK, SMOOTH, heading32, label13Mono } from "./_shared";

// Geist-aligned dark theme for prism-react-renderer
const geistDarkTheme: PrismTheme = {
  plain: {
    color: "#ededed",
    backgroundColor: "#171717",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#525252", fontStyle: "italic" as const },
    },
    {
      types: ["punctuation"],
      style: { color: "#737373" },
    },
    {
      types: ["property", "tag", "boolean", "number", "constant", "symbol"],
      style: { color: "#0070F3" },
    },
    {
      types: ["selector", "attr-name", "string", "char", "builtin", "inserted"],
      style: { color: "#46A758" },
    },
    {
      types: ["operator", "entity", "url", "variable"],
      style: { color: "#ededed" },
    },
    {
      types: ["atrule", "attr-value", "keyword"],
      style: { color: "#FF6B8A" },
    },
    {
      types: ["function", "class-name"],
      style: { color: "#FFB224" },
    },
    {
      types: ["regex", "important"],
      style: { color: "#FFB224" },
    },
  ],
};

export function CodeBlockClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as VideoCodeBlockProps;

  const code = props.code ?? "";
  const language = props.language ?? "typescript";
  const highlightLines = props.highlightLines ?? [];
  const animate = props.animate !== false;
  const fontSize = props.fontSize ?? 18;

  // Container entrance
  const entrance = spring({ fps, frame, config: SMOOTH });

  // Typewriter — reveal characters progressively
  const charsToShow = animate
    ? Math.floor(
        interpolate(
          frame,
          [6, 6 + code.length * 0.5],
          [0, code.length],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        ),
      )
    : code.length;

  const displayCode = code.slice(0, charsToShow);

  // Blinking cursor
  const cursorOpacity =
    animate && charsToShow < code.length
      ? interpolate(frame % 16, [0, 8, 8, 16], [1, 1, 0, 0])
      : 0;

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          padding: 80,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          opacity: entrance,
          transform: `translateY(${(1 - entrance) * 20}px)`,
        }}
      >
        {props.title && (
          <div style={{ ...heading32, color: DARK.foreground, marginBottom: 24 }}>
            {props.title}
          </div>
        )}

        <div
          style={{
            backgroundColor: DARK.surfaceElevated,
            border: `1px solid ${DARK.borderSubtle}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Title bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              borderBottom: `1px solid ${DARK.borderSubtle}`,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#febc2e" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#28c840" }} />
            {language && (
              <span style={{ ...label13Mono, color: DARK.mutedFg, marginLeft: 8 }}>
                {language}
              </span>
            )}
          </div>

          {/* Code content */}
          <Highlight theme={geistDarkTheme} code={displayCode} language={language}>
            {({ style, tokens, getLineProps, getTokenProps }) => (
              <pre
                style={{
                  ...style,
                  margin: 0,
                  padding: 24,
                  fontSize,
                  lineHeight: 1.6,
                  fontFamily: "var(--font-mono), 'Geist Mono', monospace",
                  backgroundColor: "transparent",
                }}
              >
                {tokens.map((line, i) => {
                  const isHighlighted = highlightLines.includes(i + 1);
                  return (
                    <div
                      key={i}
                      {...getLineProps({ line })}
                      style={{
                        display: "flex",
                        backgroundColor: isHighlighted
                          ? "rgba(0, 112, 243, 0.15)"
                          : "transparent",
                        margin: isHighlighted ? "0 -24px" : "0",
                        padding: isHighlighted ? "0 24px" : "0",
                      }}
                    >
                      <span
                        style={{
                          color: "#525252",
                          marginRight: 24,
                          minWidth: 32,
                          textAlign: "right" as const,
                          userSelect: "none" as const,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span>
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token })} />
                        ))}
                      </span>
                      {/* Cursor on last line */}
                      {i === tokens.length - 1 && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 2,
                            height: "1.2em",
                            backgroundColor: DARK.foreground,
                            opacity: cursorOpacity,
                            marginLeft: 1,
                            verticalAlign: "text-bottom",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </pre>
            )}
          </Highlight>
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
