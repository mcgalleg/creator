"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { HeroPrompt } from "@/components/landing/hero-prompt";
import { useAccentColor, type AccentColor } from "@/contexts/accent-color-context";

const PixelBlast = dynamic(
  () =>
    import("@/components/ui/pixel-blast").then((m) => m.PixelBlast),
  { ssr: false }
);

const ACCENT_HEX: Record<AccentColor, string> = {
  amber: "#f59e0b",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  emerald: "#10b981",
  fuchsia: "#d946ef",
  green: "#22c55e",
  indigo: "#6366f1",
  lime: "#84cc16",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#a855f7",
  red: "#ef4444",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  teal: "#14b8a6",
  violet: "#8b5cf6",
  yellow: "#eab308",
};

export function Hero() {
  const { accentColor } = useAccentColor();
  const pixelColor = ACCENT_HEX[accentColor];
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0">
        {isDesktop && (
          <PixelBlast
            variant="square"
            speed={0.3}
            color={pixelColor}
            pixelSize={3}
            patternScale={2}
            patternDensity={1}
            edgeFade={0.5}
            enableRipples
          />
        )}
      </div>
      <div className="container relative mx-auto max-w-4xl px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Stop Guessing. Start Growing.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Ask Astriq anything about your content, audience, or growth — and
          get actionable answers instantly.
        </p>
        <HeroPrompt />
      </div>
    </section>
  );
}
