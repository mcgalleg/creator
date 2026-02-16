import styles from "./metric-card.module.css";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: number | null;
  subtitle?: string;
}

export function MetricCard({ label, value, delta, subtitle }: MetricCardProps) {
  const deltaClass = delta == null
    ? ""
    : delta > 0
      ? styles.deltaPositive
      : delta < 0
        ? styles.deltaNegative
        : styles.deltaNeutral;

  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {delta != null && (
        <div className={`${styles.delta} ${deltaClass}`}>
          {delta > 0 ? "+" : ""}{delta}%
        </div>
      )}
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}
