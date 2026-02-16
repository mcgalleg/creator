import type { TopCommentersData } from "../types";
import { UserCard } from "../components/user-card";
import { formatNumber } from "../lib/formatters";
import appStyles from "../styles/app.module.css";

export function TopCommenters({ data }: { data: TopCommentersData }) {
  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Top Commenters</div>
        <div className={appStyles.subtitle}>Superfans ranked by frequency and influence</div>
      </div>
      <div style={{ background: "var(--color-background-secondary)", border: "1px solid var(--color-border-primary)", borderRadius: "var(--border-radius-md)" }}>
        {data.commenters.map((c, i) => (
          <UserCard
            key={c.username ?? i}
            rank={i + 1}
            username={c.username}
            avatarUrl={c.avatarUrl}
            stat={`${c.commentCount} comments${c.followerCount > 0 ? ` · ${formatNumber(c.followerCount)} followers` : ""}`}
            badge={c.influenceScore > 10 ? `${Math.round(c.influenceScore)} influence` : undefined}
          />
        ))}
      </div>
    </div>
  );
}
