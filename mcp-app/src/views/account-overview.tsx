import type { App } from "@modelcontextprotocol/ext-apps";
import type { AccountOverviewData } from "../types";
import { MetricCard } from "../components/metric-card";
import { formatNumber, formatPercent } from "../lib/formatters";
import appStyles from "../styles/app.module.css";

export function AccountOverview({ data }: { data: AccountOverviewData; app: App }) {
  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div>
          <div className={appStyles.title}>Dashboard Overview</div>
          <div className={appStyles.subtitle}>Key metrics across all accounts</div>
        </div>
      </div>
      <div className={`${appStyles.grid} ${appStyles.grid4}`}>
        <MetricCard label="Followers" value={formatNumber(data.followers)} delta={data.followerChange || null} />
        <MetricCard label="Total Plays" value={formatNumber(data.totalPlays)} delta={data.playsChange || null} />
        <MetricCard label="Engagement Rate" value={formatPercent(data.engagementRate)} delta={data.engagementRateChange || null} />
        <MetricCard label="Content Velocity" value={`${data.contentVelocity} posts`} subtitle="Last 30 days" />
        <MetricCard label="Total Likes" value={formatNumber(data.totalLikes)} />
        <MetricCard label="Total Shares" value={formatNumber(data.totalShares)} />
        <MetricCard label="Total Saves" value={formatNumber(data.totalSaves)} />
        <MetricCard label="Avg Views" value={formatNumber(data.avgViews)} />
        <MetricCard label="Total Comments" value={formatNumber(data.totalComments)} />
        <MetricCard label="Comments/Post" value={data.commentsPerPost.toFixed(1)} />
      </div>
    </div>
  );
}
