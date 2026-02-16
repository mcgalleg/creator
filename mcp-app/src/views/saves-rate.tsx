import type { SavesRateData } from "../types";
import { MetricCard } from "../components/metric-card";
import { formatNumber, formatPercent } from "../lib/formatters";
import appStyles from "../styles/app.module.css";

export function SavesRate({ data }: { data: SavesRateData }) {
  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Saves Rate</div>
      </div>
      <div className={`${appStyles.grid} ${appStyles.grid3}`}>
        <MetricCard label="Saves Rate" value={formatPercent(data.savesRate)} subtitle="Bookmarks per view" />
        <MetricCard label="Total Saves" value={formatNumber(data.totalSaves)} />
        <MetricCard label="Total Plays" value={formatNumber(data.totalPlays)} />
      </div>
    </div>
  );
}
