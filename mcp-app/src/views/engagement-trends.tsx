import { useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { EngagementTrendsData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { formatDateShort } from "../lib/formatters";
import { CHART_COLORS, CHART_COLORS_LIGHT } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function EngagementTrends({ data: initial, app }: { data: EngagementTrendsData; app: App }) {
  const [period, setPeriod] = useState(initial.period);
  const [trends, setTrends] = useState(initial.data);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    try {
      const result = await app.callServerTool({
        name: "fetch_trends",
        arguments: { trendType: "engagement", period: newPeriod, count: 12 },
      });
      const newData = result.structuredContent as EngagementTrendsData;
      if (newData?.data) setTrends(newData.data);
    } catch (e) { console.error(e); }
  };

  const chartData = {
    labels: trends.map((d) => formatDateShort(d.date)),
    datasets: [
      { label: "Plays", data: trends.map((d) => d.plays), borderColor: CHART_COLORS[0], backgroundColor: CHART_COLORS_LIGHT[0], fill: true, tension: 0.3 },
      { label: "Likes", data: trends.map((d) => d.likes), borderColor: CHART_COLORS[1], backgroundColor: CHART_COLORS_LIGHT[1], fill: false, tension: 0.3 },
      { label: "Comments", data: trends.map((d) => d.comments), borderColor: CHART_COLORS[2], backgroundColor: CHART_COLORS_LIGHT[2], fill: false, tension: 0.3 },
      { label: "Shares", data: trends.map((d) => d.shares), borderColor: CHART_COLORS[3], backgroundColor: CHART_COLORS_LIGHT[3], fill: false, tension: 0.3 },
    ],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Engagement Trends</div>
        <select className={appStyles.select} value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>
      <ChartWrapper type="line" data={chartData} />
    </div>
  );
}
