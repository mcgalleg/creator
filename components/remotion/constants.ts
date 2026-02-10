// Remotion promo trailer constants

export const FPS = 30;
// Act durations (in frames) — 7-act structure
export const ACT_1 = 190; // The Hook (extended for breathing pauses)
export const ACT_2 = 180; // The Discovery
export const ACT_3 = 160; // The Reveal
export const ACT_4 = 180; // Dashboard Showcase
export const ACT_5 = 180; // AI Chat Demo
export const ACT_6 = 240; // Excalidraw Magic (speed ramp)
export const ACT_7 = 110; // CTA Closing (room for tagline)

// Per-transition durations (in frames)
export const TRANS_1_2 = 15; // fade with spring
export const TRANS_2_3 = 20; // slide from bottom with spring
export const TRANS_3_4 = 15; // wipe
export const TRANS_4_5 = 20; // fade with spring
export const TRANS_5_6 = 15; // slide from right
export const TRANS_6_7 = 20; // fade with eased linear

// Total = sum(acts) - sum(transitions) = 1240 - 105 = 1135
export const TOTAL_DURATION_FRAMES = 1135;

// Composition dimensions
export const COMP_WIDTH = 1920;
export const COMP_HEIGHT = 1080;

// Spring presets
export const SPRING_SMOOTH = { damping: 200 };
export const SPRING_BOUNCY = { damping: 8 };
export const SPRING_MEDIUM = { damping: 14 };
export const SPRING_SNAPPY = { damping: 20, stiffness: 200 };

// Colors
export const BG_DARK = "#0f0f11";
export const BG_DARK_2 = "#1a1a2e";
export const ACCENT = "#F59E0B";
export const TEXT_PRIMARY = "#FAFAFA";
export const TEXT_MUTED = "#A1A1AA";

// Chart colors
export const CHART_BLUE = "#3B82F6";
export const CHART_GREEN = "#10B981";
export const CHART_AMBER = "#F59E0B";
export const CHART_RED = "#EF4444";

// Excalidraw colors
export const EXCALIDRAW_BLUE = "#4A90D9";
export const EXCALIDRAW_GREEN = "#6AA84F";
export const EXCALIDRAW_AMBER = "#E69138";
export const EXCALIDRAW_RED = "#CC4125";

// Layout
export const HEADER_HEIGHT = 80;
export const CHAT_WIDTH_RATIO = 0.30;
export const TAB_BAR_HEIGHT = 64;

// Font
export const FONT_SANS = "var(--font-sans), system-ui, sans-serif";
