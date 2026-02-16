import type { DurationPerformanceData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { CHART_COLORS } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function DurationPerformance({ data }: { data: DurationPerformanceData }) {
  const chartData = {
    datasets: [{
      label: "Videos",
      data: data.points.map((p) => ({ x: p.duration, y: p.plays })),
      backgroundColor: CHART_COLORS[0],
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };

  const options = {
    scales: {
      x: { title: { display: true, text: "Duration (seconds)" }, grid: { display: false } },
      y: { title: { display: true, text: "Plays" }, beginAtZero: true },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const p = data.points[ctx.dataIndex];
            return [`${p.duration}s / ${p.plays.toLocaleString()} plays`, `${p.engagementRate}% engagement`];
          },
        },
      },
    },
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Duration vs Performance</div>
      </div>
      <ChartWrapper type="scatter" data={chartData} options={options} />
    </div>
  );
}
