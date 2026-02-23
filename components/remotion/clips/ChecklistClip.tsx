import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { VideoChecklistProps } from "@/lib/video-catalog";
import { DARK, SNAPPY, heading32, copy18 } from "./_shared";

const CHECK_SVG =
  "M20 6L9 17l-5-5";

export function ChecklistClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as VideoChecklistProps;

  const items = Array.isArray(props.items) ? props.items.slice(0, 8) : [];
  const variant = props.variant ?? "success";

  const accentColor =
    variant === "info"
      ? DARK.info
      : variant === "warning"
        ? DARK.warning
        : DARK.success;

  // Title
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
          alignItems: "center",
        }}
      >
        {props.title && (
          <div
            style={{
              ...heading32,
              color: DARK.foreground,
              marginBottom: 48,
              opacity: titleS,
              transform: `translateY(${(1 - titleS) * 20}px)`,
            }}
          >
            {props.title}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 900,
            width: "100%",
          }}
        >
          {items.map((item, i) => {
            const delay = 5 + i * 4;
            const s = spring({ fps, frame, config: SNAPPY, delay });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  opacity: s,
                  transform: `translateX(${(1 - s) * 40}px)`,
                }}
              >
                {/* Check icon circle */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: `${accentColor}20`,
                    border: `1.5px solid ${accentColor}66`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={accentColor}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={CHECK_SVG} />
                  </svg>
                </div>

                <span style={{ ...copy18, color: DARK.foreground }}>
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
