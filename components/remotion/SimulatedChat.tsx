import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { DARK, ACCENT_AMBER, SPRING_PUNCH } from "./constants";

interface SimulatedChatProps {
  frame: number;
  sceneStartFrame: number;
}

const TYPING_TEXT_1 = "What are my top performing videos this month?";
const TYPING_TEXT_2 = "Visualize my content strategy";

const BAR_DATA = [
  { label: "Morning routine tips", plays: 23100, display: "23.1K" },
  { label: "Day in my life vlog", plays: 18400, display: "18.4K" },
  { label: "Cooking hack #viral", plays: 12800, display: "12.8K" },
  { label: "Outfit ideas for spring", plays: 9200, display: "9.2K" },
  { label: "Study with me", plays: 7500, display: "7.5K" },
];

const BAR_COLORS = [DARK.chart1, DARK.chart2, DARK.chart3, DARK.chart4, DARK.chart5];
const MAX_PLAYS = BAR_DATA[0].plays;

export const SimulatedChat: React.FC<SimulatedChatProps> = ({
  frame,
  sceneStartFrame,
}) => {
  const { fps } = useVideoConfig();
  const f = frame - sceneStartFrame;

  // ═══════════════════════════════════════════
  // Phase 1: First prompt (analytics question)
  // ═══════════════════════════════════════════
  const phase1Focus = f >= 33;
  const phase1Typing = f >= 38 && f < 125;
  const phase1Sent = f >= 125;

  const phase1CharsTyped = phase1Typing
    ? Math.min(
        Math.floor((f - 38) * (TYPING_TEXT_1.length / 82)),
        TYPING_TEXT_1.length,
      )
    : 0;
  const phase1TypedText = phase1Typing ? TYPING_TEXT_1.slice(0, phase1CharsTyped) : "";

  // User bubble 1
  const showBubble1 = f >= 125;
  const bubble1Progress = showBubble1
    ? spring({ frame: f - 125, fps, config: SPRING_PUNCH })
    : 0;

  // AI skeleton (f=135-170)
  const showSkeleton = f >= 135 && f < 170;
  const skeletonPulse = showSkeleton
    ? 0.5 + 0.2 * Math.sin(((f - 135) / 12) * Math.PI * 2)
    : 0;

  // AI text response (f >= 170)
  const showAiResponse = f >= 170;
  const aiTextOpacity = showAiResponse
    ? interpolate(f, [170, 190], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Bar chart (f >= 190, bars stagger by 12)
  const showChart = f >= 190;

  // ═══════════════════════════════════════════
  // Phase 2: Second prompt (canvas trigger)
  // Starts earlier, slower typing so users can read it
  // ═══════════════════════════════════════════
  const phase2Focus = f >= 433;
  const phase2Typing = f >= 436 && f < 483;
  const phase2Sent = f >= 486;

  // ~0.6 chars/frame = readable pace
  const phase2CharsTyped = phase2Typing
    ? Math.min(
        Math.floor((f - 436) * (TYPING_TEXT_2.length / 44)),
        TYPING_TEXT_2.length,
      )
    : 0;
  const phase2TypedText = phase2Typing ? TYPING_TEXT_2.slice(0, phase2CharsTyped) : "";

  // User bubble 2
  const showBubble2 = f >= 486;
  const bubble2Progress = showBubble2
    ? spring({ frame: f - 486, fps, config: SPRING_PUNCH })
    : 0;

  // AI thinking dots (f=493-508)
  const showThinking = f >= 493 && f < 508;
  const thinkingDot = showThinking ? Math.floor((f - 493) / 4) % 3 : 0;

  // ═══════════════════════════════════════════
  // Input field state (combines both phases)
  // ═══════════════════════════════════════════
  const isAnyTyping = phase1Typing || phase2Typing;
  const isInputFocused = (phase1Focus && !phase1Sent) || (phase2Focus && !phase2Sent);

  // Blinking cursor
  const showInputCursor = isAnyTyping && Math.floor(f / 12) % 2 === 0;

  // Current input text
  let inputContent: React.ReactNode;
  if (phase2Typing) {
    inputContent = (
      <span style={{ fontSize: 14, color: DARK.foreground }}>
        {phase2TypedText}
        <span style={{ opacity: showInputCursor ? 1 : 0, color: DARK.foreground }}>|</span>
      </span>
    );
  } else if (phase1Typing) {
    inputContent = (
      <span style={{ fontSize: 14, color: DARK.foreground }}>
        {phase1TypedText}
        <span style={{ opacity: showInputCursor ? 1 : 0, color: DARK.foreground }}>|</span>
      </span>
    );
  } else {
    inputContent = (
      <span style={{ fontSize: 14, color: DARK.mutedFg }}>
        Ask about your analytics...
      </span>
    );
  }

  // Input glow during typing
  const glowIntensity = isAnyTyping
    ? 0.4 + 0.2 * Math.sin((f / 8) * Math.PI * 2)
    : 0;
  const inputGlow = isAnyTyping
    ? `0 0 20px rgba(245,158,11,${glowIntensity}), 0 0 40px rgba(245,158,11,${glowIntensity * 0.5})`
    : "none";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: DARK.card,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ═══ Chat Header ═══ */}
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: `1px solid ${DARK.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="16" height="12" rx="3"
              stroke={DARK.foreground} strokeWidth="1.5" fill="none" />
            <path d="M5 16 L9 13 L13 16"
              stroke={DARK.foreground} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <circle cx="5.5" cy="7" r="1" fill={DARK.foreground} />
            <circle cx="9" cy="7" r="1" fill={DARK.foreground} />
            <circle cx="12.5" cy="7" r="1" fill={DARK.foreground} />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 600, color: DARK.foreground }}>
            Analytics Assistant
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: DARK.green }} />
          <span style={{ fontSize: 12, color: DARK.mutedFg }}>Online</span>
        </div>
      </div>

      {/* ═══ Messages Area ═══ */}
      <div
        style={{
          flex: 1,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          overflow: "hidden",
        }}
      >
        {/* Initial AI greeting */}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div
            style={{
              backgroundColor: DARK.muted,
              borderRadius: 12,
              padding: "10px 14px",
              maxWidth: "75%",
              fontSize: 13,
              lineHeight: 1.5,
              color: DARK.foreground,
            }}
          >
            Hi! I&apos;m your analytics assistant. Ask me anything about your TikTok performance.
          </div>
        </div>

        {/* ─── Phase 1: User bubble ─── */}
        {showBubble1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              transform: `translateY(${interpolate(bubble1Progress, [0, 1], [20, 0], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              })}px)`,
              opacity: interpolate(bubble1Progress, [0, 1], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                backgroundColor: DARK.primary,
                color: DARK.primaryFg,
                borderRadius: 12,
                padding: "10px 14px",
                maxWidth: "75%",
                fontSize: 13,
                lineHeight: 1.5,
                fontWeight: 500,
              }}
            >
              {TYPING_TEXT_1}
            </div>
          </div>
        )}

        {/* ─── Phase 1: AI skeleton ─── */}
        {showSkeleton && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                backgroundColor: DARK.muted,
                borderRadius: 12,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ width: 200, height: 10, borderRadius: 5, backgroundColor: DARK.mutedFg, opacity: skeletonPulse }} />
              <div style={{ width: 140, height: 10, borderRadius: 5, backgroundColor: DARK.mutedFg, opacity: skeletonPulse }} />
            </div>
          </div>
        )}

        {/* ─── Phase 1: AI response + chart ─── */}
        {showAiResponse && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                backgroundColor: DARK.muted,
                borderRadius: 12,
                padding: 14,
                maxWidth: "85%",
                opacity: aiTextOpacity,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: DARK.foreground,
                  marginBottom: showChart ? 12 : 0,
                }}
              >
                Here are your top 5 videos from the last 30 days:
              </div>

              {showChart && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {BAR_DATA.map((item, i) => {
                    const barStartFrame = 190 + i * 12;
                    if (f < barStartFrame) return null;

                    const barProgress = spring({
                      frame: f - barStartFrame,
                      fps,
                      config: SPRING_PUNCH,
                    });
                    const barWidthFraction = item.plays / MAX_PLAYS;

                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 150,
                            flexShrink: 0,
                            fontSize: 11,
                            color: DARK.mutedFg,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.label}
                        </div>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                          <div
                            style={{
                              height: 22,
                              borderRadius: 5,
                              backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                              width: `${barWidthFraction * 100 * barProgress}%`,
                              minWidth: barProgress > 0 ? 3 : 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 11,
                              color: DARK.foreground,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              opacity: interpolate(barProgress, [0.5, 1], [0, 1], {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                              }),
                            }}
                          >
                            {item.display}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Phase 2: User bubble ─── */}
        {showBubble2 && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              transform: `translateY(${interpolate(bubble2Progress, [0, 1], [20, 0], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              })}px)`,
              opacity: interpolate(bubble2Progress, [0, 1], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              }),
            }}
          >
            <div
              style={{
                backgroundColor: DARK.primary,
                color: DARK.primaryFg,
                borderRadius: 12,
                padding: "10px 14px",
                maxWidth: "75%",
                fontSize: 13,
                lineHeight: 1.5,
                fontWeight: 500,
              }}
            >
              {TYPING_TEXT_2}
            </div>
          </div>
        )}

        {/* ─── Phase 2: AI thinking dots ─── */}
        {showThinking && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                backgroundColor: DARK.muted,
                borderRadius: 12,
                padding: "10px 16px",
                display: "flex",
                gap: 6,
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: DARK.mutedFg,
                    opacity: thinkingDot >= i ? 0.8 : 0.3,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Input Field ═══ */}
      <div style={{ padding: "0 16px 16px 16px", flexShrink: 0 }}>
        <div
          style={{
            height: 48,
            backgroundColor: isInputFocused ? "#444444" : DARK.muted,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            border: isAnyTyping
              ? `1px solid ${ACCENT_AMBER}`
              : isInputFocused
                ? "1px solid rgba(255,255,255,0.2)"
                : "1px solid transparent",
            boxShadow: inputGlow,
          }}
        >
          {inputContent}
        </div>
      </div>
    </div>
  );
};
