import { AbsoluteFill, Easing } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import {
  ACT_1,
  ACT_2,
  ACT_3,
  ACT_4,
  ACT_5,
  ACT_6,
  ACT_7,
  TRANS_1_2,
  TRANS_2_3,
  TRANS_3_4,
  TRANS_4_5,
  TRANS_5_6,
  TRANS_6_7,
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
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_1_2 })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_2} premountFor={30}>
          <Act2Discovery />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_2_3 })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_3} premountFor={30}>
          <Act3Reveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe()}
          timing={linearTiming({ durationInFrames: TRANS_3_4 })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_4} premountFor={30}>
          <Act4Dashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_4_5 })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_5} premountFor={30}>
          <Act5AiChat />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_5_6 })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_6} premountFor={30}>
          <Act6Excalidraw />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({
            durationInFrames: TRANS_6_7,
            easing: Easing.inOut(Easing.cubic),
          })}
        />
        <TransitionSeries.Sequence durationInFrames={ACT_7} premountFor={30}>
          <Act7Cta />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
