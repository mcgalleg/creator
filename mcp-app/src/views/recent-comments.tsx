import { useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { RecentCommentsData } from "../types";
import { CommentCard } from "../components/comment-card";
import appStyles from "../styles/app.module.css";

export function RecentComments({ data: initial, app }: { data: RecentCommentsData; app: App }) {
  const [comments, setComments] = useState(initial.comments);
  const [total] = useState(initial.total);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchPage = async (newOffset: number) => {
    try {
      const result = await app.callServerTool({
        name: "fetch_comments",
        arguments: { limit, offset: newOffset },
      });
      const data = result.structuredContent as RecentCommentsData;
      if (data?.comments) { setComments(data.comments); setOffset(newOffset); }
    } catch (e) { console.error(e); }
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div>
          <div className={appStyles.title}>Recent Comments</div>
          <div className={appStyles.subtitle}>{total} total comments</div>
        </div>
      </div>
      <div style={{ background: "var(--color-background-secondary)", border: "1px solid var(--color-border-primary)", borderRadius: "var(--border-radius-md)" }}>
        {comments.map((c) => (
          <CommentCard key={c.id} {...c} />
        ))}
      </div>
      <div className={appStyles.pagination}>
        <button className={appStyles.paginationBtn} disabled={offset === 0} onClick={() => fetchPage(offset - limit)}>Prev</button>
        <span className={appStyles.paginationInfo}>{offset + 1}-{Math.min(offset + limit, total)} of {total}</span>
        <button className={appStyles.paginationBtn} disabled={offset + limit >= total} onClick={() => fetchPage(offset + limit)}>Next</button>
      </div>
    </div>
  );
}
