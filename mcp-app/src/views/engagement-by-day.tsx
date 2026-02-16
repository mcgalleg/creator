import type { EngagementByDayData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { CHART_COLORS } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function EngagementByDay({ data }: { data: EngagementByDayData }) {
  const chartData = {
    labels: data.days.map((d) => d.shortDay),
    datasets: [{
      label: "Engagement Rate %",
      data: data.days.map((d) => d.engagementRate),
      backgroundColor: CHART_COLORS[2],
      borderRadius: 4,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Engagement by Day</div>
        <div className={appStyles.subtitle}>Average engagement rate by day of week</div>
      </div>
      <ChartWrapper type="bar" data={chartData} />
    </div>
  );
}
