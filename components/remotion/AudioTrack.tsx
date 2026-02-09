import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

export const AudioTrack: React.FC = () => {
  return <Audio src={staticFile("music.mp3")} volume={0.5} />;
};
