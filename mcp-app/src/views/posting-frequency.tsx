import type { PostingFrequencyData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { CHART_COLORS } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function PostingFrequency({ data }: { data: PostingFrequencyData }) {
  const chartData = {
    labels: data.days.map((d) => d.shortDay),
    datasets: [{
      label: "Posts",
      data: data.days.map((d) => d.posts),
      backgroundColor: CHART_COLORS[0],
      borderRadius: 4,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Posting Frequency</div>
        <div className={appStyles.subtitle}>Posts by day of week</div>
      </div>
      <ChartWrapper type="bar" data={chartData} />
    </div>
  );
}
