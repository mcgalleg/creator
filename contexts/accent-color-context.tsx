"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export const ACCENT_COLORS = [
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "green",
  "indigo",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "teal",
  "violet",
  "yellow",
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number];

interface AccentColorContextValue {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

const AccentColorContext = createContext<AccentColorContextValue | null>(null);

const STORAGE_KEY = "accent-color";
const DEFAULT_ACCENT: AccentColor = "amber";

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(DEFAULT_ACCENT);

  // Sync from localStorage after hydration to avoid server/client mismatch.
  // The inline script in <head> already sets the data-accent attribute so CSS
  // variables are correct immediately — this just syncs React state.
  // Sync from localStorage after mount. The inline <head> script already sets
  // the data-accent attribute so CSS variables are correct immediately — this
  // just aligns React state. The synchronous setState is intentional to avoid
  // a render with stale accent color.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ACCENT_COLORS.includes(stored as AccentColor)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccentColorState(stored as AccentColor);
    }
  }, []);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem(STORAGE_KEY, color);
    document.documentElement.setAttribute("data-accent", color);
  }, []);

  return (
    <AccentColorContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor(): AccentColorContextValue {
  const context = useContext(AccentColorContext);
  if (!context) {
    throw new Error("useAccentColor must be used within an AccentColorProvider");
  }
  return context;
}
