import { useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { HashtagTrendsData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { formatDateShort } from "../lib/formatters";
import { CHART_COLORS } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function HashtagTrends({ data: initial, app }: { data: HashtagTrendsData; app: App }) {
  const [period, setPeriod] = useState(initial.period);
  const [hashtags, setHashtags] = useState(initial.hashtags);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    try {
      const result = await app.callServerTool({
        name: "fetch_trends",
        arguments: { trendType: "hashtag_trends", period: newPeriod, count: 12 },
      });
      const data = result.structuredContent as HashtagTrendsData;
      if (data?.hashtags) setHashtags(data.hashtags);
    } catch (e) { console.error(e); }
  };

  const labels = hashtags[0]?.points.map((p) => formatDateShort(p.date)) ?? [];

  const chartData = {
    labels,
    datasets: hashtags.map((h, i) => ({
      label: `#${h.tag}`,
      data: h.points.map((p) => p.count),
      borderColor: CHART_COLORS[i % CHART_COLORS.length],
      backgroundColor: "transparent",
      tension: 0.3,
    })),
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Hashtag Trends</div>
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
