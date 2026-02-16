export const CHART_COLORS = [
  "rgba(59, 130, 246, 0.8)",   // blue
  "rgba(139, 92, 246, 0.8)",   // purple
  "rgba(16, 185, 129, 0.8)",   // green
  "rgba(245, 158, 11, 0.8)",   // amber
  "rgba(239, 68, 68, 0.8)",    // red
  "rgba(236, 72, 153, 0.8)",   // pink
  "rgba(20, 184, 166, 0.8)",   // teal
  "rgba(249, 115, 22, 0.8)",   // orange
];

export const CHART_COLORS_LIGHT = CHART_COLORS.map(c => c.replace("0.8)", "0.2)"));

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function getChartColorLight(index: number): string {
  return CHART_COLORS_LIGHT[index % CHART_COLORS_LIGHT.length];
}
