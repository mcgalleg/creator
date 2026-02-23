// Dark mode palette (from app's CSS variables, converted to hex for Remotion)
// Extended with Geist design system semantic colors
export const DARK = {
  bg: "#1a1a1a",
  card: "#2d2d2d",
  foreground: "#fafafa",
  muted: "#3d3d3d",
  mutedFg: "#a3a3a3",
  border: "rgba(255,255,255,0.1)",
  primary: "#e5e5e5",
  primaryFg: "#2d2d2d",
  green: "#4ade80",
  chart1: "#6366f1",
  chart2: "#2dd4bf",
  chart3: "#fbbf24",
  chart4: "#c084fc",
  chart5: "#fb7185",

  // Geist semantic colors
  success: "#46A758",
  error: "#E5484D",
  warning: "#FFB224",
  info: "#0070F3",

  // Geist surface colors
  surface: "#0a0a0a",
  surfaceElevated: "#171717",
  borderSubtle: "#292929",
  borderDefault: "#737373",
};

export const CHART_COLORS = [
  "#6366f1",
  "#2dd4bf",
  "#fbbf24",
  "#c084fc",
  "#fb7185",
];

/** Data viz — no bounce */
export const SMOOTH = { damping: 200 };
/** Charts & cinematic — slight bounce, dramatic */
export const PUNCHY = { damping: 15, stiffness: 120 };
/** UI elements */
export const SNAPPY = { damping: 20, stiffness: 200 };
/** Playful elements only */
export const BOUNCY = { damping: 8 };
