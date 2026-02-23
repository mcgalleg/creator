import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { VideoDataTableProps } from "@/lib/video-catalog";
import { DARK, PUNCHY, heading32, label14Mono, copy18 } from "./_shared";

export function DataTableClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as VideoDataTableProps;
  const columns = Array.isArray(props.columns) ? props.columns : [];
  const rows = Array.isArray(props.data) ? props.data.slice(0, 8) : [];

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
              marginBottom: 32,
            }}
          >
            {props.title}
          </div>
        )}
        <div
          style={{
            backgroundColor: DARK.card,
            border: `1px solid ${DARK.borderSubtle}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              padding: "16px 24px",
              backgroundColor: DARK.card,
            }}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                style={{
                  ...label14Mono,
                  flex: 1,
                  fontWeight: 600,
                  color: DARK.mutedFg,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {col.header}
              </div>
            ))}
          </div>
          {/* Data rows */}
          {rows.map((row, i) => {
            const s = spring({ fps, frame, config: PUNCHY, delay: i * 3 });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  padding: "16px 24px",
                  backgroundColor:
                    i % 2 === 1 ? "rgba(255,255,255,0.03)" : "transparent",
                  opacity: s,
                  transform: `translateY(${(1 - s) * 40}px)`,
                }}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    style={{
                      ...copy18,
                      flex: 1,
                      color: DARK.foreground,
                    }}
                  >
                    {String(row[col.key] ?? "")}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
