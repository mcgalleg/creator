import type { EngagementBreakdownData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { CHART_COLORS } from "../lib/colors";
import { formatNumber } from "../lib/formatters";
import appStyles from "../styles/app.module.css";

export function EngagementBreakdown({ data }: { data: EngagementBreakdownData }) {
  const chartData = {
    labels: data.breakdown.map((b) => b.type.charAt(0).toUpperCase() + b.type.slice(1)),
    datasets: [{
      data: data.breakdown.map((b) => b.value),
      backgroundColor: CHART_COLORS.slice(0, 4),
      borderWidth: 0,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Engagement Breakdown</div>
      </div>
      <ChartWrapper type="doughnut" data={chartData} height={260} />
    </div>
  );
}
