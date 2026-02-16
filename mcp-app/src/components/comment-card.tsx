import { timeAgo } from "../lib/formatters";
import styles from "./comment-card.module.css";

interface CommentCardProps {
  text: string | null;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  likes: number;
  createdAt: string | null;
}

export function CommentCard({ text, authorUsername, authorAvatarUrl, likes, createdAt }: CommentCardProps) {
  return (
    <div className={styles.card}>
      {authorAvatarUrl ? (
        <img src={authorAvatarUrl} alt="" className={styles.avatar} />
      ) : (
        <div className={styles.avatar} />
      )}
      <div className={styles.body}>
        <div className={styles.username}>@{authorUsername ?? "unknown"}</div>
        <div className={styles.text}>{text ?? ""}</div>
        <div className={styles.meta}>
          <span>{likes > 0 ? `${likes} likes` : ""}</span>
          <span>{timeAgo(createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
