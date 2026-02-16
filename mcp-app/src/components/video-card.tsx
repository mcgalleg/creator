import { formatNumber, formatDate } from "../lib/formatters";
import styles from "./video-card.module.css";

interface VideoCardProps {
  description: string | null;
  thumbnailUrl: string | null;
  plays: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  postedAt: string | null;
  engagementRate: number;
  extra?: React.ReactNode;
}

export function VideoCard({
  description, thumbnailUrl, plays, likes, comments, shares, saves, postedAt, engagementRate, extra,
}: VideoCardProps) {
  const badgeClass = engagementRate > 5
    ? styles.badgeGood
    : engagementRate > 2
      ? styles.badgeWarn
      : styles.badgeBad;

  return (
    <div className={styles.card}>
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className={styles.thumbnail} />
      ) : (
        <div className={styles.thumbnail} />
      )}
      <div className={styles.info}>
        <div className={styles.description}>
          {description || "No description"}
        </div>
        <div className={styles.stats}>
          <span className={styles.stat}><span className={styles.statValue}>{formatNumber(plays)}</span> plays</span>
          <span className={styles.stat}><span className={styles.statValue}>{formatNumber(likes)}</span> likes</span>
          <span className={styles.stat}><span className={styles.statValue}>{formatNumber(comments)}</span> comments</span>
          <span className={styles.stat}><span className={styles.statValue}>{formatNumber(shares)}</span> shares</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span className={`${styles.badge} ${badgeClass}`}>{engagementRate}% eng.</span>
          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-tertiary)" }}>{formatDate(postedAt)}</span>
        </div>
        {extra}
      </div>
    </div>
  );
}
