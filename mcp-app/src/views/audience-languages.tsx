import type { AudienceLanguagesData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { formatNumber } from "../lib/formatters";
import { CHART_COLORS } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function AudienceLanguages({ data }: { data: AudienceLanguagesData }) {
  const top8 = data.languages.slice(0, 8);

  const chartData = {
    labels: top8.map((l) => l.name),
    datasets: [{
      data: top8.map((l) => l.commentCount),
      backgroundColor: CHART_COLORS.slice(0, 8),
      borderWidth: 0,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div>
          <div className={appStyles.title}>Audience Languages</div>
          <div className={appStyles.subtitle}>{formatNumber(data.totalComments)} comments in {data.languages.length} languages</div>
        </div>
      </div>
      <ChartWrapper type="doughnut" data={chartData} height={260} />
    </div>
  );
}
