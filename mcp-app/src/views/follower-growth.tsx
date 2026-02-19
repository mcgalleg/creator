import { useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { FollowerGrowthData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { formatDateShort } from "../lib/formatters";
import { CHART_COLORS, CHART_COLORS_LIGHT } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function FollowerGrowth({ data: initial, app }: { data: FollowerGrowthData; app: App }) {
  const [period, setPeriod] = useState(initial.period);
  const [points, setPoints] = useState(initial.points);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    try {
      const result = await app.callServerTool({
        name: "fetch_trends",
        arguments: { trendType: "follower_growth", period: newPeriod, count: 12 },
      });
      const newData = result.structuredContent as FollowerGrowthData;
      if (newData?.points) setPoints(newData.points);
    } catch (e) { console.error(e); }
  };

  const chartData = {
    labels: points.map((p) => formatDateShort(p.date)),
    datasets: [{
      label: "Followers",
      data: points.map((p) => p.followers),
      borderColor: CHART_COLORS[0],
      backgroundColor: CHART_COLORS_LIGHT[0],
      fill: true,
      tension: 0.3,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Follower Growth</div>
        <select className={appStyles.select} value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>
      <ChartWrapper type="area" data={chartData} />
    </div>
  );
}
