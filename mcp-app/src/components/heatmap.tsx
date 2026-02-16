import styles from "./heatmap.module.css";

interface HeatmapProps {
  data: Array<{ day: number; hour: number; avgEngagement: number }>;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Heatmap({ data }: HeatmapProps) {
  const maxVal = Math.max(...data.map(d => d.avgEngagement), 1);

  const getColor = (value: number) => {
    const intensity = value / maxVal;
    if (intensity === 0) return "var(--color-background-tertiary)";
    const alpha = 0.15 + intensity * 0.85;
    return `rgba(59, 130, 246, ${alpha})`;
  };

  return (
    <div className={styles.container}>
      {/* Hour labels row */}
      <div style={{ display: "grid", gridTemplateColumns: "48px repeat(24, 1fr)", gap: 2, marginBottom: 4 }}>
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className={styles.hourLabel}>
            {h % 3 === 0 ? `${h}` : ""}
          </div>
        ))}
      </div>

      {/* Heatmap rows */}
      {DAY_LABELS.map((dayLabel, dayIdx) => (
        <div key={dayIdx} style={{ display: "grid", gridTemplateColumns: "48px repeat(24, 1fr)", gap: 2, marginBottom: 2 }}>
          <div className={styles.dayLabel}>{dayLabel}</div>
          {Array.from({ length: 24 }, (_, h) => {
            const cell = data.find(d => d.day === dayIdx && d.hour === h);
            const value = cell?.avgEngagement ?? 0;
            return (
              <div
                key={h}
                className={styles.cell}
                style={{ background: getColor(value) }}
                title={`${dayLabel} ${h}:00 - Avg engagement: ${value.toLocaleString()}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
