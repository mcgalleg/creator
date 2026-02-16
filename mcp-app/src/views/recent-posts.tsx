import { useState } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { RecentPostsData } from "../types";
import { VideoCard } from "../components/video-card";
import appStyles from "../styles/app.module.css";

export function RecentPosts({ data: initial, app }: { data: RecentPostsData; app: App }) {
  const [posts, setPosts] = useState(initial.posts);
  const [total] = useState(initial.total);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState("postedAt");
  const limit = 10;

  const fetchPage = async (newOffset: number, newSort?: string) => {
    const sort = newSort ?? sortBy;
    try {
      const result = await app.callServerTool({
        name: "fetch_posts",
        arguments: { sortBy: sort, sortOrder: "desc", limit, offset: newOffset },
      });
      const data = result.structuredContent as RecentPostsData;
      if (data?.posts) { setPosts(data.posts); setOffset(newOffset); }
    } catch (e) { console.error(e); }
  };

  const handleSort = (s: string) => {
    setSortBy(s);
    fetchPage(0, s);
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div>
          <div className={appStyles.title}>Recent Posts</div>
          <div className={appStyles.subtitle}>{total} total posts</div>
        </div>
        <select className={appStyles.select} value={sortBy} onChange={(e) => handleSort(e.target.value)}>
          <option value="postedAt">Date</option>
          <option value="plays">Plays</option>
          <option value="likes">Likes</option>
          <option value="comments">Comments</option>
          <option value="shares">Shares</option>
        </select>
      </div>
      <div className={appStyles.grid}>
        {posts.map((p) => (
          <VideoCard key={p.id} {...p} />
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
