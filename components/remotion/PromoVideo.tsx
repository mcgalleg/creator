import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import {
  ACT_1,
  ACT_2,
  ACT_3,
  ACT_4,
  ACT_5,
  ACT_6,
  ACT_7,
  TRANSITION_DURATION,
  BG_DARK,
} from "./constants";
import {
  Act1Hook,
  Act2Discovery,
  Act3Reveal,
  Act4Dashboard,
  Act5AiChat,
  Act6Excalidraw,
  Act7Cta,
} from "./scenes";
import { AudioTrack } from "./AudioTrack";

export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG_DARK }}>
      <AudioTrack />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={ACT_1} premountFor={30}>
          <Act1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_2} premountFor={30}>
          <Act2Discovery />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_3} premountFor={30}>
          <Act3Reveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_4} premountFor={30}>
          <Act4Dashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_5} premountFor={30}>
          <Act5AiChat />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_6} premountFor={30}>
          <Act6Excalidraw />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_7} premountFor={30}>
          <Act7Cta />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
