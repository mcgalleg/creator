import type { PeriodComparisonData } from "../types";
import { MetricCard } from "../components/metric-card";
import { formatNumber } from "../lib/formatters";
import appStyles from "../styles/app.module.css";

export function PeriodComparison({ data }: { data: PeriodComparisonData }) {
  const metrics = ["likes", "comments", "shares", "plays", "saves"] as const;

  return (
    <div className={appStyles.container}>
      <div className={appStyles.header}>
        <div>
          <div className={appStyles.title}>Period Comparison</div>
          <div className={appStyles.subtitle}>
            {data.period1.start ?? "?"} - {data.period1.end ?? "?"} vs {data.period2.start ?? "?"} - {data.period2.end ?? "?"}
          </div>
        </div>
      </div>
      <div className={`${appStyles.grid} ${appStyles.grid3}`}>
        {metrics.map((m) => (
          <MetricCard
            key={m}
            label={m.charAt(0).toUpperCase() + m.slice(1)}
            value={formatNumber(data.period2[m] ?? 0)}
            delta={data.changes[m] ?? null}
            subtitle={`was ${formatNumber(data.period1[m] ?? 0)}`}
          />
        ))}
      </div>
    </div>
  );
}
