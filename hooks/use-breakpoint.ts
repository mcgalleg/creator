"use client";

import { useSyncExternalStore } from "react";

export type Breakpoint = "lg" | "md" | "sm";

const BREAKPOINTS = {
  lg: 1024, // >= 1024px
  md: 768,  // >= 768px and < 1024px
  sm: 0,    // < 768px
} as const;

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  return "sm";
}

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getSnapshot(): Breakpoint {
  return getBreakpoint(window.innerWidth);
}

function getServerSnapshot(): Breakpoint {
  return "lg"; // Default to large breakpoint on server
}

/**
 * Hook to detect current responsive breakpoint
 * Returns "lg", "md", or "sm" based on window width
 */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Returns the breakpoint widths for use in CSS or layout calculations
 */
export function getBreakpoints() {
  return BREAKPOINTS;
}
