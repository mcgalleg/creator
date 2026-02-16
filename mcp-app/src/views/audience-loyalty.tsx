import type { AudienceLoyaltyData } from "../types";
import { MetricCard } from "../components/metric-card";
import { ChartWrapper } from "../components/chart-wrapper";
import { formatNumber, formatPercent } from "../lib/formatters";
import { CHART_COLORS } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function AudienceLoyalty({ data }: { data: AudienceLoyaltyData }) {
  const chartData = {
    labels: ["Repeat", "One-time"],
    datasets: [{
      data: [data.repeat, data.oneTime],
      backgroundColor: [CHART_COLORS[2], CHART_COLORS[3]],
      borderWidth: 0,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Audience Loyalty</div>
      </div>
      <div className={`${appStyles.grid} ${appStyles.grid3}`}>
        <MetricCard label="Loyalty Rate" value={formatPercent(data.loyaltyRate)} subtitle="Repeat commenters" />
        <MetricCard label="Repeat" value={formatNumber(data.repeat)} subtitle={`of ${formatNumber(data.total)} total`} />
        <MetricCard label="One-time" value={formatNumber(data.oneTime)} />
      </div>
      <div style={{ marginTop: 12 }}>
        <ChartWrapper type="doughnut" data={chartData} height={200} />
      </div>
    </div>
  );
}
