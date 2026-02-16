import { formatNumber } from "../lib/formatters";
import styles from "./user-card.module.css";

interface UserCardProps {
  rank: number;
  username: string | null;
  avatarUrl: string | null;
  stat: string;
  badge?: string;
}

export function UserCard({ rank, username, avatarUrl, stat, badge }: UserCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.rank}>{rank}</div>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className={styles.avatar} />
      ) : (
        <div className={styles.avatar} />
      )}
      <div className={styles.info}>
        <div className={styles.username}>@{username ?? "unknown"}</div>
        <div className={styles.stats}>{stat}</div>
      </div>
      {badge && <div className={styles.badge}>{badge}</div>}
    </div>
  );
}
