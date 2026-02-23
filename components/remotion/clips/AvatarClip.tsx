import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { VideoAvatarProps } from "@/lib/video-catalog";
import { DARK, BOUNCY } from "./_shared";
import { ProxyImg } from "./_shared/ProxyImg";

export function AvatarClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as VideoAvatarProps;
  const imageSrc = props.src || (props.username ? `/api/avatar?username=${encodeURIComponent(props.username)}` : undefined);
  const scale = spring({ fps, frame, config: BOUNCY });

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
            width: 200,
            height: 200,
            borderRadius: "50%",
            backgroundColor: DARK.muted,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${scale})`,
            overflow: "hidden",
          }}
        >
          {imageSrc ? (
            <ProxyImg
              src={imageSrc}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              fallback={
                <span style={{ fontSize: 72, fontWeight: 700, color: DARK.foreground }}>
                  {props.fallback}
                </span>
              }
            />
          ) : (
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: DARK.foreground,
              }}
            >
              {props.fallback}
            </span>
          )}
        </div>
      </AbsoluteFill>
    </ClipWrapper>
  );
}
