import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, SNAPPY, heading48, heading20, label14Mono } from "./_shared";

interface ListItem {
  label: string;
  value?: string;
}

interface AnimatedListProps {
  items: ListItem[];
  title?: string;
}

export function AnimatedListClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as AnimatedListProps;

  const items = Array.isArray(props.items) ? props.items.slice(0, 8) : [];

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          padding: 80,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {props.title && (
          <div
            style={{
              ...heading48,
              color: DARK.foreground,
              marginBottom: 48,
            }}
          >
            {props.title}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, i) => {
            const delay = i * 8;
            const s = spring({ fps, frame, config: SNAPPY, delay });
            const translateX = (1 - s) * 200;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: DARK.card,
                  borderRadius: 12,
                  padding: "20px 32px",
                  border: `1px solid ${DARK.borderSubtle}`,
                  opacity: s,
                  transform: `translateX(${translateX}px)`,
                }}
              >
                <div style={{ ...heading20, color: DARK.foreground, flex: 1 }}>
                  {item.label}
                </div>
                {item.value && (
                  <div style={{ ...label14Mono, color: DARK.mutedFg }}>
                    {item.value}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
