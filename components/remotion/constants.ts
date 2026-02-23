// Demo video constants — specific to the tutorial/promotional video
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

// Re-export DARK for demo files that import from ./constants
export { DARK } from "./clips/_shared/palette";
