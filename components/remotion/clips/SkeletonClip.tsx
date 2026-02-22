import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { DARK, clampedInterpolate } from "./_shared";

interface SkeletonProps {
  width?: string;
  height?: string;
}

export function SkeletonClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const props = clip.props as unknown as SkeletonProps;
  const cycle = fps * 2;
  const loopFrame = frame % cycle;
  const opacity =
    loopFrame < cycle / 2
      ? clampedInterpolate(loopFrame, [0, cycle / 2], [0.3, 0.7])
      : clampedInterpolate(loopFrame, [cycle / 2, cycle], [0.7, 0.3]);

  return (
    <ClipWrapper clip={clip}>
      <AbsoluteFill
        style={{
          backgroundColor: DARK.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: props.width ?? "80%",
            height: props.height ?? 200,
            backgroundColor: DARK.muted,
            borderRadius: 12,
            opacity,
          }}
        />
      </AbsoluteFill>
    </ClipWrapper>
  );
}
