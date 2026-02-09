"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import Three.js background to avoid slow compilation in dev mode
const PixelBlastBg = dynamic(
  () => import("./pixel-blast-bg").then((mod) => mod.PixelBlastBg),
  { ssr: false }
);

interface LazyPixelBlastBgProps {
  color?: string;
  useThemeColor?: boolean;
  className?: string;
}

function getComputedPrimary(): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim();
  // Create a temporary element to resolve the oklch value to a hex color
  const el = document.createElement("div");
  el.style.color = raw;
  document.body.appendChild(el);
  const resolved = getComputedStyle(el).color;
  document.body.removeChild(el);
  return resolved;
}

export function LazyPixelBlastBg({ color, useThemeColor, className }: LazyPixelBlastBgProps) {
  const [resolvedColor, setResolvedColor] = useState(color ?? "#F59E0B");

  useEffect(() => {
    if (!useThemeColor) return;

    const updateColor = () => setResolvedColor(getComputedPrimary());

    // Initial read via rAF to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(updateColor);

    // Re-read when accent changes
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-accent", "class"],
    });
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [useThemeColor]);

  return <PixelBlastBg color={resolvedColor} className={className} />;
}
