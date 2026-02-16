import type { UnderperformingData } from "../types";
import { VideoCard } from "../components/video-card";
import appStyles from "../styles/app.module.css";

export function Underperforming({ data }: { data: UnderperformingData }) {
  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Underperforming Content</div>
        <div className={appStyles.subtitle}>Below average engagement</div>
      </div>
      <div className={appStyles.grid}>
        {data.posts.map((p) => (
          <VideoCard key={p.id} {...p} extra={
            <span style={{ fontSize: "0.6875rem", color: "var(--color-error)" }}>-{p.performanceGap}% below avg ({p.avgEngagementRate}%)</span>
          } />
        ))}
      </div>
    </div>
  );
}
