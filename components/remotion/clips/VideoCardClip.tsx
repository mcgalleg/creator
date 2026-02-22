import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { DARK, SNAPPY, countUp, formatCompact } from "./_shared";
import { ProxyImg } from "./_shared/ProxyImg";

interface VideoCardProps {
  thumbnailUrl?: string;
  postId?: number;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  plays: number;
}

const STATS_CONFIG: { key: keyof VideoCardProps; label: string }[] = [
  { key: "plays", label: "Plays" },
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
];

function FilmPlaceholder() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke={DARK.mutedFg}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
      <line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  );
}

export function VideoCardClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as VideoCardProps;
  const thumbnailSrc = props.thumbnailUrl || (props.postId ? `/api/thumbnail?postId=${props.postId}` : undefined);
  const s = spring({ fps, frame, config: SNAPPY });

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          padding: 80,
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: DARK.card,
            borderRadius: 16,
            padding: 32,
            maxWidth: 700,
            width: "100%",
            opacity: s,
            transform: `scale(${0.9 + s * 0.1})`,
          }}
        >
          {/* Thumbnail */}
          <div
            style={{
              width: "100%",
              height: 360,
              backgroundColor: DARK.muted,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              overflow: "hidden",
            }}
          >
            {thumbnailSrc ? (
              <ProxyImg
                src={thumbnailSrc}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                fallback={<FilmPlaceholder />}
              />
            ) : (
              <FilmPlaceholder />
            )}
          </div>
          {/* Description */}
          <div
            style={{
              fontSize: 20,
              color: DARK.foreground,
              marginBottom: 20,
              lineHeight: 1.4,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {props.description}
          </div>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 32 }}>
            {STATS_CONFIG.map((stat, i) => {
              const val = countUp(
                Math.max(0, frame - i * 3),
                fps,
                props[stat.key] as number,
                1,
              );
              return (
                <div key={stat.key} style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      fontSize: 14,
                      color: DARK.mutedFg,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: DARK.foreground,
                      fontFamily: "var(--font-mono), monospace",
                    }}
                  >
                    {formatCompact(val)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
