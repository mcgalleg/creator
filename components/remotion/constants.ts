export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;
export const TOTAL_FRAMES = 1545; // ~51.5s at 30fps

export const BG_BLACK = "#000000";
export const TEXT_WHITE = "#FAFAFA";
export const ACCENT_AMBER = "#F59E0B";
export const ACCENT_AMBER_DIM = "rgba(245,158,11,0.3)";

export const SPRING_PUNCH = { damping: 8 };
export const SPRING_SMOOTH = { damping: 200 };

export const SCENES = {
  logo:      { start: 0,    end: 50   },
  card1:     { start: 50,   end: 206  },
  appReveal: { start: 206,  end: 276  },
  dashboard: { start: 276,  end: 486  },
  card2:     { start: 486,  end: 647  },
  chat:      { start: 647,  end: 1155 },
  card3:     { start: 897,  end: 1080 },
  canvas:    { start: 1155, end: 1305 },
  cta:       { start: 1305, end: 1545 },
} as const;

// Dark mode palette (from app's CSS variables, converted to hex for Remotion)
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
};
