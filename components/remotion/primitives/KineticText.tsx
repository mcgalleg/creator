"use client";

import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";

type Entrance =
  | { type: "slideIn"; from: "left" | "right" | "top" | "bottom"; distance?: number }
  | { type: "scaleIn"; from?: number; bounce?: boolean }
  | { type: "fadeIn" }
  | { type: "rotateIn"; degrees?: number }
  | { type: "wordByWord"; delayPerWord?: number }
  | { type: "blur"; from?: number; to?: number };

type Exit =
  | { type: "slideOut"; to: "left" | "right" | "top" | "bottom" }
  | { type: "scaleOut"; to?: number }
  | { type: "fadeOut" }
  | { type: "scatter" };

interface KineticTextProps {
  text: string;
  startFrame?: number;
  durationFrames?: number;
  exitFrame?: number;
  exitDurationFrames?: number;
  entrance?: Entrance;
  exit?: Exit;
  style?: React.CSSProperties;
}

const seededRandom = (i: number) => ((i * 9301 + 49297) % 233280) / 233280;

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  startFrame = 0,
  durationFrames = 30,
  exitFrame,
  exitDurationFrames = 20,
  entrance = { type: "fadeIn" },
  exit,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProgress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );

  const exitProgress =
    exit && exitFrame !== undefined
      ? interpolate(
          frame,
          [exitFrame, exitFrame + exitDurationFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )
      : 0;

  // Word-by-word entrance
  if (entrance.type === "wordByWord") {
    const words = text.split(" ");
    const delayPerWord = entrance.delayPerWord ?? 6;
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0 16px",
          justifyContent: "center",
          alignItems: "center",
          ...style,
        }}
      >
        {words.map((word, i) => {
          const wordStart = startFrame + i * delayPerWord;
          const wordOpacity = interpolate(
            frame,
            [wordStart, wordStart + 12],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const wordY = interpolate(
            frame,
            [wordStart, wordStart + 12],
            [30, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          let exitOpacity = 1;
          if (exit && exitFrame !== undefined) {
            if (exit.type === "fadeOut") {
              exitOpacity = interpolate(
                frame,
                [exitFrame, exitFrame + exitDurationFrames],
                [1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );
            }
          }
          return (
            <span
              key={i}
              style={{
                opacity: wordOpacity * exitOpacity,
                transform: `translateY(${wordY}px)`,
                display: "inline-block",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  }

  // Scatter exit: render individual characters
  if (exit?.type === "scatter" && exitFrame !== undefined && frame >= exitFrame) {
    const chars = text.split("");
    return (
      <div style={{ position: "relative", ...style }}>
        {chars.map((char, i) => {
          const angle = seededRandom(i) * Math.PI * 2;
          const dist = 160 + seededRandom(i + 100) * 400;
          const rot = (seededRandom(i + 200) - 0.5) * 360;
          const tx = Math.cos(angle) * dist * exitProgress;
          const ty = Math.sin(angle) * dist * exitProgress;
          const charRot = rot * exitProgress;
          const charOpacity = interpolate(exitProgress, [0, 0.7, 1], [1, 0.6, 0]);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: `translate(${tx}px, ${ty}px) rotate(${charRot}deg)`,
                opacity: charOpacity,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    );
  }

  // Build entrance transform/opacity
  let enterOpacity = 1;
  let enterTransform = "";
  let enterFilter = "";

  switch (entrance.type) {
    case "slideIn": {
      const dist = entrance.distance ?? 200;
      const axis =
        entrance.from === "left" || entrance.from === "right" ? "X" : "Y";
      const sign =
        entrance.from === "left" || entrance.from === "top" ? -1 : 1;
      const offset = interpolate(enterProgress, [0, 1], [sign * dist, 0]);
      enterTransform = `translate${axis}(${offset}px)`;
      enterOpacity = interpolate(enterProgress, [0, 0.3], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    }
    case "scaleIn": {
      const from = entrance.from ?? 0;
      let scaleVal: number;
      if (entrance.bounce) {
        scaleVal = spring({
          frame: frame - startFrame,
          fps,
          config: { damping: 8 },
        });
        scaleVal = from + scaleVal * (1 - from);
      } else {
        scaleVal = interpolate(enterProgress, [0, 1], [from, 1]);
      }
      enterTransform = `scale(${scaleVal})`;
      enterOpacity = interpolate(enterProgress, [0, 0.2], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    }
    case "fadeIn": {
      enterOpacity = enterProgress;
      break;
    }
    case "rotateIn": {
      const deg = entrance.degrees ?? 180;
      const rot = interpolate(enterProgress, [0, 1], [deg, 0]);
      enterTransform = `rotate(${rot}deg)`;
      enterOpacity = interpolate(enterProgress, [0, 0.4], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    }
    case "blur": {
      const blurFrom = entrance.from ?? 20;
      const blurTo = entrance.to ?? 0;
      const blurVal = interpolate(enterProgress, [0, 1], [blurFrom, blurTo]);
      enterFilter = `blur(${blurVal}px)`;
      enterOpacity = interpolate(enterProgress, [0, 0.5], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    }
  }

  // Build exit transform/opacity
  let exitOpacity = 1;
  let exitTransform = "";

  if (exit && exitFrame !== undefined) {
    switch (exit.type) {
      case "slideOut": {
        const axis =
          exit.to === "left" || exit.to === "right" ? "X" : "Y";
        const sign = exit.to === "right" || exit.to === "bottom" ? 1 : -1;
        const offset = interpolate(exitProgress, [0, 1], [0, sign * 200]);
        exitTransform = `translate${axis}(${offset}px)`;
        exitOpacity = interpolate(exitProgress, [0.7, 1], [1, 0], {
          extrapolateLeft: "clamp",
        });
        break;
      }
      case "scaleOut": {
        const to = exit.to ?? 0;
        const scaleVal = interpolate(exitProgress, [0, 1], [1, to]);
        exitTransform = `scale(${scaleVal})`;
        exitOpacity = interpolate(exitProgress, [0.5, 1], [1, 0], {
          extrapolateLeft: "clamp",
        });
        break;
      }
      case "fadeOut": {
        exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);
        break;
      }
      // scatter handled above
    }
  }

  const combinedTransform = [enterTransform, exitTransform]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      style={{
        opacity: enterOpacity * exitOpacity,
        transform: combinedTransform || undefined,
        filter: enterFilter || undefined,
        ...style,
      }}
    >
      {text}
    </div>
  );
};
