import type { BestPostingTimesData } from "../types";
import { Heatmap } from "../components/heatmap";
import appStyles from "../styles/app.module.css";

export function BestPostingTimes({ data }: { data: BestPostingTimesData }) {
  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div>
          <div className={appStyles.title}>Best Posting Times</div>
          <div className={appStyles.subtitle}>Average engagement by day and hour</div>
        </div>
      </div>
      <Heatmap data={data.heatmap} />
    </div>
  );
}
