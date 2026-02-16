import type { TopHashtagsData } from "../types";
import { DataTable } from "../components/data-table";
import { formatNumber } from "../lib/formatters";
import appStyles from "../styles/app.module.css";

export function TopHashtags({ data }: { data: TopHashtagsData }) {
  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div>
          <div className={appStyles.title}>Top Hashtags</div>
          <div className={appStyles.subtitle}>{data.total} unique hashtags</div>
        </div>
      </div>
      <DataTable
        columns={[
          { key: "tag", header: "Hashtag", render: (r) => `#${r.tag}` },
          { key: "usage", header: "Uses", render: (r) => r.usageCount.toString(), align: "right" },
          { key: "avgPlays", header: "Avg Plays", render: (r) => formatNumber(r.avgPlays), align: "right" },
          { key: "avgLikes", header: "Avg Likes", render: (r) => formatNumber(r.avgLikes), align: "right" },
          { key: "engRate", header: "Eng. Rate", render: (r) => `${r.avgEngagementRate}%`, align: "right" },
        ]}
        data={data.hashtags}
      />
    </div>
  );
}
