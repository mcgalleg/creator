import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut, Scatter } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import styles from "./chart-wrapper.module.css";

// Register all needed Chart.js components once
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

// Shared defaults that respect CSS variables
const baseOptions: ChartOptions<any> = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: true, position: "top" as const, labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
    tooltip: { mode: "index" as const, intersect: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } },
    },
    y: {
      grid: { color: "rgba(128,128,128,0.1)" },
      ticks: { font: { size: 10 } },
      beginAtZero: true,
    },
  },
};

interface ChartWrapperProps {
  type: "line" | "bar" | "doughnut" | "scatter" | "area";
  data: ChartData<any>;
  options?: ChartOptions<any>;
  height?: number;
}

export function ChartWrapper({ type, data, options, height }: ChartWrapperProps) {
  const mergedOptions = { ...baseOptions, ...options };

  // Doughnut doesn't use scales
  if (type === "doughnut") {
    delete (mergedOptions as any).scales;
  }

  const chartProps = { data, options: mergedOptions, height: height ?? 280 };

  return (
    <div className={styles.container}>
      {type === "line" || type === "area" ? (
        <Line {...chartProps} />
      ) : type === "bar" ? (
        <Bar {...chartProps} />
      ) : type === "doughnut" ? (
        <Doughnut {...chartProps} />
      ) : type === "scatter" ? (
        <Scatter {...chartProps} />
      ) : null}
    </div>
  );
}
