import type { AccountComparisonData } from "../types";
import { ChartWrapper } from "../components/chart-wrapper";
import { formatNumber } from "../lib/formatters";
import { CHART_COLORS } from "../lib/colors";
import { DataTable } from "../components/data-table";
import appStyles from "../styles/app.module.css";

export function AccountComparison({ data }: { data: AccountComparisonData }) {
  const labels = ["Followers", "Likes", "Plays", "Shares"];

  const chartData = {
    labels,
    datasets: data.accounts.map((a, i) => ({
      label: `@${a.username}`,
      data: [a.metrics.followers, a.metrics.likes, a.metrics.plays, a.metrics.shares],
      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
      borderRadius: 4,
    })),
  };

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div className={appStyles.title}>Account Comparison</div>
      </div>
      <ChartWrapper type="bar" data={chartData} />
      <div style={{ marginTop: 12 }}>
        <DataTable
          columns={[
            { key: "username", header: "Account", render: (r) => `@${r.username}` },
            { key: "followers", header: "Followers", render: (r) => formatNumber(r.metrics.followers), align: "right" },
            { key: "engagement", header: "Eng. Rate", render: (r) => `${r.metrics.engagement}%`, align: "right" },
            { key: "plays", header: "Plays", render: (r) => formatNumber(r.metrics.plays), align: "right" },
          ]}
          data={data.accounts}
        />
      </div>
    </div>
  );
}
