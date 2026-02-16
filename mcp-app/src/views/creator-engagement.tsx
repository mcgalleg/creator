import type { CreatorEngagementData } from "../types";
import { MetricCard } from "../components/metric-card";
import { ChartWrapper } from "../components/chart-wrapper";
import { formatNumber, formatPercent, formatDateShort } from "../lib/formatters";
import { CHART_COLORS, CHART_COLORS_LIGHT } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function CreatorEngagement({ data }: { data: CreatorEngagementData }) {
  const chartData = {
    labels: data.trend.map((t) => formatDateShort(t.date)),
    datasets: [{
      label: "Liked Rate %",
      data: data.trend.map((t) => t.likedRate),
      borderColor: CHART_COLORS[2],
      backgroundColor: CHART_COLORS_LIGHT[2],
      fill: true,
      tension: 0.3,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Creator Engagement</div>
        <div className={appStyles.subtitle}>How often you respond to comments</div>
      </div>
      <div className={`${appStyles.grid} ${appStyles.grid3}`} style={{ marginBottom: 12 }}>
        <MetricCard label="Liked Rate" value={formatPercent(data.likedRate)} subtitle="Comments you liked" />
        <MetricCard label="Total Liked" value={formatNumber(data.totalLiked)} />
        <MetricCard label="Total Comments" value={formatNumber(data.totalComments)} />
      </div>
      <ChartWrapper type="area" data={chartData} />
    </div>
  );
}
