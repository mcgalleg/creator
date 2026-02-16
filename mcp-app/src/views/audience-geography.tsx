import type { AudienceGeographyData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { MetricCard } from "../components/metric-card";
import { formatNumber } from "../lib/formatters";
import { CHART_COLORS } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function AudienceGeography({ data }: { data: AudienceGeographyData }) {
  const top10 = data.regions.slice(0, 10);

  const chartData = {
    labels: top10.map((r) => r.name),
    datasets: [{
      label: "Commenters",
      data: top10.map((r) => r.commentCount),
      backgroundColor: CHART_COLORS[0],
      borderRadius: 4,
    }],
  };

  const options = {
    indexAxis: "y" as const,
    plugins: { legend: { display: false } },
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div>
          <div className={appStyles.title}>Audience Geography</div>
          <div className={appStyles.subtitle}>{formatNumber(data.totalCommenters)} commenters from {data.regions.length} regions</div>
        </div>
      </div>
      <ChartWrapper type="bar" data={chartData} options={options} height={320} />
    </div>
  );
}
