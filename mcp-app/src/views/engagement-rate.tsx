import type { App } from "@modelcontextprotocol/ext-apps";
import { useState } from "react";
import { ChartWrapper } from "../components/chart-wrapper";
import { formatDateShort } from "../lib/formatters";
import { CHART_COLORS, CHART_COLORS_LIGHT } from "../lib/colors";
import appStyles from "../styles/app.module.css";

interface EngagementRateData {
  _type: "engagement_rate";
  period: string;
  data: Array<{ date: string; engagementRate: number }>;
}

export function EngagementRate({ data: initial, app }: { data: EngagementRateData; app: App }) {
  const [period, setPeriod] = useState(initial.period);
  const [points, setPoints] = useState(initial.data);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    try {
      const result = await app.callServerTool({
        name: "fetch_trends",
        arguments: { trendType: "engagement_rate", period: newPeriod, count: 12 },
      });
      const data = result.structuredContent as EngagementRateData;
      if (data?.data) setPoints(data.data);
    } catch (e) { console.error(e); }
  };

  const chartData = {
    labels: points.map((p) => formatDateShort(p.date)),
    datasets: [{
      label: "Engagement Rate %",
      data: points.map((p) => p.engagementRate),
      borderColor: CHART_COLORS[4],
      backgroundColor: CHART_COLORS_LIGHT[4],
      fill: true,
      tension: 0.3,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Engagement Rate Trend</div>
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
