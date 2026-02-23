import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { VideoCardGridProps } from "@/lib/video-catalog";
import { DARK, SNAPPY, heading32, heading20, copy16 } from "./_shared";

export function CardGridClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as VideoCardGridProps;

  const cards = Array.isArray(props.cards) ? props.cards.slice(0, 6) : [];
  const columns = props.columns ?? (cards.length <= 2 ? 2 : cards.length <= 4 ? 2 : 3);

  // Title entrance
  const titleS = spring({ fps, frame, config: SNAPPY });

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
        }}
      >
        {props.title && (
          <div
            style={{
              ...heading32,
              color: DARK.foreground,
              marginBottom: 40,
              opacity: titleS,
              transform: `translateY(${(1 - titleS) * 20}px)`,
            }}
          >
            {props.title}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 20,
          }}
        >
          {cards.map((card, i) => {
            const delay = 5 + i * 4;
            const s = spring({ fps, frame, config: SNAPPY, delay });

            return (
              <div
                key={i}
                style={{
                  backgroundColor: DARK.card,
                  border: `1px solid ${DARK.borderSubtle}`,
                  borderRadius: 16,
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  opacity: s,
                  transform: `translateY(${(1 - s) * 30}px)`,
                }}
              >
                {/* Icon or value badge */}
                {(card.icon || card.value) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: DARK.surfaceElevated,
                      border: `1px solid ${DARK.borderSubtle}`,
                      color: DARK.info,
                      fontSize: card.value ? 18 : 24,
                      fontWeight: card.value ? 700 : 400,
                      fontFamily: card.value
                        ? "var(--font-mono), monospace"
                        : "inherit",
                    }}
                  >
                    {card.value ?? card.icon}
                  </div>
                )}

                <div style={{ ...heading20, color: DARK.foreground }}>
                  {card.title}
                </div>
                <div style={{ ...copy16, color: DARK.mutedFg }}>
                  {card.description}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
