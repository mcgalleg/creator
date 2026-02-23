import type { CSSProperties } from "react";

/**
 * Geist typography style presets for Remotion clips.
 *
 * Each returns a CSSProperties object that can be spread into a `style` prop.
 * Font family falls back to system-ui so clips render even outside the app shell.
 */

const SANS = "var(--font-sans), 'Geist', system-ui, sans-serif";
const MONO = "var(--font-mono), 'Geist Mono', monospace";

// ---------------------------------------------------------------------------
// Headings – semibold, tight letter-spacing
// ---------------------------------------------------------------------------

export const heading48: CSSProperties = {
  fontFamily: SANS,
  fontSize: 48,
  fontWeight: 600,
  lineHeight: "56px",
  letterSpacing: "-2.88px",
};

export const heading32: CSSProperties = {
  fontFamily: SANS,
  fontSize: 32,
  fontWeight: 600,
  lineHeight: "40px",
  letterSpacing: "-1.28px",
};

export const heading24: CSSProperties = {
  fontFamily: SANS,
  fontSize: 24,
  fontWeight: 600,
  lineHeight: "32px",
  letterSpacing: "-0.96px",
};

export const heading20: CSSProperties = {
  fontFamily: SANS,
  fontSize: 20,
  fontWeight: 600,
  lineHeight: "26px",
  letterSpacing: "-0.4px",
};

export const heading16: CSSProperties = {
  fontFamily: SANS,
  fontSize: 16,
  fontWeight: 600,
  lineHeight: "24px",
  letterSpacing: "-0.32px",
};

// ---------------------------------------------------------------------------
// Labels – normal weight
// ---------------------------------------------------------------------------

export const label16: CSSProperties = {
  fontFamily: SANS,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: "20px",
};

export const label14: CSSProperties = {
  fontFamily: SANS,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: "20px",
};

export const label13: CSSProperties = {
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 400,
  lineHeight: "16px",
};

export const label14Mono: CSSProperties = {
  fontFamily: MONO,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: "20px",
};

export const label13Mono: CSSProperties = {
  fontFamily: MONO,
  fontSize: 13,
  fontWeight: 400,
  lineHeight: "20px",
};

// ---------------------------------------------------------------------------
// Copy – body text
// ---------------------------------------------------------------------------

export const copy18: CSSProperties = {
  fontFamily: SANS,
  fontSize: 18,
  fontWeight: 400,
  lineHeight: "28px",
};

export const copy16: CSSProperties = {
  fontFamily: SANS,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: "24px",
};

export const copy14: CSSProperties = {
  fontFamily: SANS,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: "20px",
};

export const copy14Mono: CSSProperties = {
  fontFamily: MONO,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: "20px",
};
