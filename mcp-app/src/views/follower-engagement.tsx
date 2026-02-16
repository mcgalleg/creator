import type { FollowerEngagementData } from "../types";
import { MetricCard } from "../components/metric-card";
import { formatNumber } from "../lib/formatters";
import appStyles from "../styles/app.module.css";

export function FollowerEngagement({ data }: { data: FollowerEngagementData }) {
  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Follower Engagement</div>
      </div>
      <div className={`${appStyles.grid} ${appStyles.grid3}`}>
        <MetricCard label="Views / Followers" value={`${data.ratio}x`} subtitle="How many times followers watch" />
        <MetricCard label="Total Plays" value={formatNumber(data.totalPlays)} />
        <MetricCard label="Followers" value={formatNumber(data.followers)} />
      </div>
    </div>
  );
}
