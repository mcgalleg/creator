import { useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { SoundAnalyticsData } from "../types";
import { DataTable } from "../components/data-table";
import { MetricCard } from "../components/metric-card";
import { formatNumber, formatDuration } from "../lib/formatters";
import appStyles from "../styles/app.module.css";

export function SoundAnalytics({ data: initial, app }: { data: SoundAnalyticsData; app: App }) {
  const [sortBy, setSortBy] = useState("plays");
  const [sounds, setSounds] = useState(initial.sounds);

  const handleSort = async (newSort: string) => {
    setSortBy(newSort);
    try {
      const result = await app.callServerTool({
        name: "fetch_sound_analytics",
        arguments: { sortBy: newSort, limit: 10 },
      });
      const data = result.structuredContent as SoundAnalyticsData;
      if (data?.sounds) setSounds(data.sounds);
    } catch (e) { console.error(e); }
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Sound Analytics</div>
        <select className={appStyles.select} value={sortBy} onChange={(e) => handleSort(e.target.value)}>
          <option value="plays">By Plays</option>
          <option value="likes">By Likes</option>
          <option value="usage">By Usage</option>
        </select>
      </div>
      <div className={`${appStyles.grid} ${appStyles.grid2}`} style={{ marginBottom: 12 }}>
        <MetricCard label="Original Sounds" value={initial.totalOriginal.toString()} />
        <MetricCard label="Trending Sounds" value={initial.totalTrending.toString()} />
      </div>
      <DataTable
        columns={[
          { key: "title", header: "Sound", render: (r) => (
            <div>
              <div style={{ fontWeight: 500 }}>{r.title}</div>
              {r.artist && <div style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)" }}>{r.artist}</div>}
            </div>
          )},
          { key: "usage", header: "Uses", render: (r) => r.usageCount.toString(), align: "right" },
          { key: "avgPlays", header: "Avg Plays", render: (r) => formatNumber(r.avgPlays), align: "right" },
          { key: "engRate", header: "Eng. Rate", render: (r) => `${r.avgEngagementRate}%`, align: "right" },
          { key: "duration", header: "Duration", render: (r) => r.duration ? formatDuration(r.duration) : "-", align: "right" },
        ]}
        data={sounds}
      />
    </div>
  );
}
