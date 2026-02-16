import { useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { HashtagPerformanceData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { CHART_COLORS } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function HashtagPerformance({ data: initial, app }: { data: HashtagPerformanceData; app: App }) {
  const [sortBy, setSortBy] = useState(initial.sortBy);
  const [hashtags, setHashtags] = useState(initial.hashtags);

  const handleSort = async (newSort: string) => {
    setSortBy(newSort);
    try {
      const result = await app.callServerTool({
        name: "fetch_hashtag_performance",
        arguments: { sortBy: newSort, limit: 10 },
      });
      const data = result.structuredContent as HashtagPerformanceData;
      if (data?.hashtags) setHashtags(data.hashtags);
    } catch (e) { console.error(e); }
  };

  const chartData = {
    labels: hashtags.map((h) => `#${h.tag}`),
    datasets: [{
      label: "Avg Engagement Rate %",
      data: hashtags.map((h) => h.avgEngagementRate),
      backgroundColor: CHART_COLORS[1],
      borderRadius: 4,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Hashtag Performance</div>
        <select className={appStyles.select} value={sortBy} onChange={(e) => handleSort(e.target.value)}>
          <option value="engagement">By Engagement</option>
          <option value="likes">By Likes</option>
          <option value="plays">By Plays</option>
        </select>
      </div>
      <ChartWrapper type="bar" data={chartData} />
    </div>
  );
}
