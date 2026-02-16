import { useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { CommentActivityData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { formatDateShort, formatNumber } from "../lib/formatters";
import { CHART_COLORS, CHART_COLORS_LIGHT } from "../lib/colors";
import appStyles from "../styles/app.module.css";

export function CommentActivity({ data: initial, app }: { data: CommentActivityData; app: App }) {
  const [period, setPeriod] = useState(initial.period);
  const [activity, setActivity] = useState(initial.activity);

  const handlePeriodChange = async (newPeriod: string) => {
    setPeriod(newPeriod);
    try {
      const result = await app.callServerTool({
        name: "fetch_trends",
        arguments: { trendType: "comment_activity", period: newPeriod, count: 12 },
      });
      const data = result.structuredContent as CommentActivityData;
      if (data?.activity) setActivity(data.activity);
    } catch (e) { console.error(e); }
  };

  const chartData = {
    labels: activity.map((a) => formatDateShort(a.date)),
    datasets: [{
      label: "Comments",
      data: activity.map((a) => a.comments),
      borderColor: CHART_COLORS[2],
      backgroundColor: CHART_COLORS_LIGHT[2],
      fill: true,
      tension: 0.3,
    }],
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div>
          <div className={appStyles.title}>Comment Activity</div>
          <div className={appStyles.subtitle}>{formatNumber(initial.total)} total comments</div>
        </div>
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
