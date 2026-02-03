"use client";

import dynamic from "next/dynamic";

// Dynamically import Three.js background to avoid slow compilation in dev mode
const PixelBlastBg = dynamic(
  () => import("./pixel-blast-bg").then((mod) => mod.PixelBlastBg),
  { ssr: false }
);

interface LazyPixelBlastBgProps {
  color?: string;
  className?: string;
}

export function LazyPixelBlastBg({ color, className }: LazyPixelBlastBgProps) {
  return <PixelBlastBg color={color} className={className} />;
}
