import type { ViralPostsData } from "../types";
import { VideoCard } from "../components/video-card";
import appStyles from "../styles/app.module.css";

export function ViralPosts({ data }: { data: ViralPostsData }) {
  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Viral Posts</div>
        <div className={appStyles.subtitle}>Highest share rates</div>
      </div>
      <div className={appStyles.grid}>
        {data.posts.map((p) => (
          <VideoCard key={p.id} {...p} extra={
            <span style={{ fontSize: "0.6875rem", color: "var(--color-accent-secondary)", fontWeight: 600 }}>{p.shareRate}% share rate</span>
          } />
        ))}
      </div>
    </div>
  );
}
