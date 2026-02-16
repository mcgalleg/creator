import type { ViralityScoreData } from "../types";
import { MetricCard } from "../components/metric-card";
import { formatNumber, formatPercent } from "../lib/formatters";
import appStyles from "../styles/app.module.css";

export function ViralityScore({ data }: { data: ViralityScoreData }) {
  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Virality Score</div>
      </div>
      <div className={`${appStyles.grid} ${appStyles.grid3}`}>
        <MetricCard label="Virality Score" value={formatPercent(data.viralityScore)} subtitle="Shares per view" />
        <MetricCard label="Total Shares" value={formatNumber(data.totalShares)} />
        <MetricCard label="Total Plays" value={formatNumber(data.totalPlays)} />
      </div>
    </div>
  );
}
