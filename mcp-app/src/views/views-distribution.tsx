import type { ViewsDistributionData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { CHART_COLORS } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function ViewsDistribution({ data }: { data: ViewsDistributionData }) {
  const chartData = {
    labels: data.buckets.map((b) => b.label),
    datasets: [{
      label: "Videos",
      data: data.buckets.map((b) => b.count),
      backgroundColor: CHART_COLORS[1],
      borderRadius: 4,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Views Distribution</div>
        <div className={appStyles.subtitle}>Number of videos by view range</div>
      </div>
      <ChartWrapper type="bar" data={chartData} />
    </div>
  );
}
