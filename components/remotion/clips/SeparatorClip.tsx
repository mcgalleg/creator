import { ClipWrapper, type Clip } from "@json-render/remotion";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { DARK, clampedInterpolate } from "./_shared";

export function SeparatorClip({ clip }: { clip: Clip }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const width = clampedInterpolate(frame, [0, fps * 0.5], [0, 100]);

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
            width: `${width}%`,
            height: 2,
            backgroundColor: DARK.border,
          }}
        />
      </AbsoluteFill>
    </ClipWrapper>
  );
}
