import { useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { TopContentData } from "../types";
import { VideoCard } from "../components/video-card";
import appStyles from "../styles/app.module.css";

export function TopContent({ data: initial, app }: { data: TopContentData; app: App }) {
  const [metric, setMetric] = useState(initial.metric);
  const [posts, setPosts] = useState(initial.posts);

  const handleMetricChange = async (m: string) => {
    setMetric(m);
    try {
      const result = await app.callServerTool({
        name: "fetch_top_content",
        arguments: { metric: m, limit: 5 },
      });
      const data = result.structuredContent as TopContentData;
      if (data?.posts) setPosts(data.posts);
    } catch (e) { console.error(e); }
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Top Content</div>
        <select className={appStyles.select} value={metric} onChange={(e) => handleMetricChange(e.target.value)}>
          <option value="likes">By Likes</option>
          <option value="plays">By Plays</option>
          <option value="comments">By Comments</option>
          <option value="shares">By Shares</option>
        </select>
      </div>
      <div className={appStyles.grid}>
        {posts.map((p, i) => (
          <VideoCard key={p.id} {...p} extra={
            <span style={{ fontSize: "0.6875rem", color: "var(--color-accent-primary)", fontWeight: 600 }}>#{i + 1}</span>
          } />
        ))}
      </div>
    </div>
  );
}
