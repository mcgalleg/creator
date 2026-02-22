import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, SMOOTH } from "./_shared";

interface DataTableProps {
  columns: { key: string; header: string }[];
  data: Record<string, unknown>[];
  title?: string;
}

export function DataTableClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as DataTableProps;
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
              fontSize: 36,
              fontWeight: 700,
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
                  flex: 1,
                  fontSize: 16,
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
            const s = spring({ fps, frame, config: SMOOTH, delay: i * 3 });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  padding: "16px 24px",
                  backgroundColor:
                    i % 2 === 1 ? "rgba(255,255,255,0.03)" : "transparent",
                  opacity: s,
                  transform: `translateY(${(1 - s) * 20}px)`,
                }}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    style={{
                      flex: 1,
                      fontSize: 18,
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
