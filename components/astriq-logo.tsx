"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface AstriqLogoProps {
  variant?: "combo" | "icon";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-6",
  md: "h-10",
  lg: "h-14",
} as const;

export function AstriqLogo({
  variant = "combo",
  size = "md",
  className,
}: AstriqLogoProps) {
  const id = useId();
  const prefix = `astriq-${id.replace(/:/g, "")}`;

  if (variant === "icon") {
    return <AstriqIcon prefix={prefix} className={cn(SIZES[size], "w-auto", className)} />;
  }

  return <AstriqCombo prefix={prefix} className={cn(SIZES[size], "w-auto", className)} />;
}

function AstriqIcon({ prefix, className }: { prefix: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      role="img"
      aria-label="Astriq"
      className={className}
    >
      <defs>
        <radialGradient id={`${prefix}-ns`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <filter id={`${prefix}-nsg`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${prefix}-ng`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <g transform="translate(100, 105) scale(1.8)">
        {/* Connection lines */}
        <g
          className="stroke-blue-500/30 dark:stroke-blue-400/30"
          strokeWidth="0.7"
          strokeLinecap="round"
          fill="none"
        >
          <line x1="0" y1="-38" x2="0" y2="0" />
          <line x1="0" y1="-38" x2="33" y2="-20" />
          <line x1="0" y1="-38" x2="-33" y2="-5" />
          <line x1="33" y1="-20" x2="36" y2="14" />
          <line x1="33" y1="-20" x2="0" y2="0" />
          <line x1="36" y1="14" x2="16" y2="34" />
          <line x1="16" y1="34" x2="-18" y2="28" />
          <line x1="-18" y1="28" x2="-33" y2="-5" />
          <line x1="-33" y1="-5" x2="0" y2="0" />
        </g>

        {/* North Star glow */}
        <circle cx="0" cy="-38" r="6" className="fill-amber-500 dark:fill-amber-500" opacity="0.25" filter={`url(#${prefix}-nsg)`} />
        {/* Center glow */}
        <circle cx="0" cy="0" r="5" className="fill-blue-400 dark:fill-blue-400" opacity="0.15" filter={`url(#${prefix}-ng)`} />

        {/* Nodes */}
        <circle cx="36" cy="14" r="2" className="fill-[#1E3A5F] dark:fill-[#60A5FA]" opacity="0.6" />
        <circle cx="-18" cy="28" r="2" className="fill-[#1E3A5F] dark:fill-[#60A5FA]" opacity="0.6" />
        <circle cx="16" cy="34" r="2.5" className="fill-[#1E3A5F] dark:fill-[#60A5FA]" opacity="0.7" />
        <circle cx="-33" cy="-5" r="2.5" className="fill-[#1E3A5F] dark:fill-[#60A5FA]" opacity="0.7" />
        <circle cx="33" cy="-20" r="2.5" className="fill-[#1E3A5F] dark:fill-[#60A5FA]" opacity="0.8" />
        <circle cx="0" cy="0" r="3" className="fill-[#2563EB] dark:fill-[#93C5FD]" />
        {/* North Star */}
        <circle cx="0" cy="-38" r="3.5" fill={`url(#${prefix}-ns)`} />
      </g>
    </svg>
  );
}

function AstriqCombo({ prefix, className }: { prefix: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 520 140"
      role="img"
      aria-label="Astriq"
      className={className}
    >
      <defs>
        <radialGradient id={`${prefix}-ns`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <filter id={`${prefix}-nsglow`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id={`${prefix}-nodeglow`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Constellation Icon */}
      <g transform="translate(72, 70)">
        {/* Connection lines */}
        <g
          className="stroke-blue-500/30 dark:stroke-blue-400/30"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        >
          <line x1="0" y1="-38" x2="0" y2="0" />
          <line x1="0" y1="-38" x2="33" y2="-20" />
          <line x1="0" y1="-38" x2="-33" y2="-5" />
          <line x1="33" y1="-20" x2="36" y2="14" />
          <line x1="33" y1="-20" x2="0" y2="0" />
          <line x1="36" y1="14" x2="16" y2="34" />
          <line x1="16" y1="34" x2="-18" y2="28" />
          <line x1="-18" y1="28" x2="-33" y2="-5" />
          <line x1="-33" y1="-5" x2="0" y2="0" />
        </g>

        {/* North Star glow */}
        <circle cx="0" cy="-38" r="8" className="fill-amber-500 dark:fill-amber-500" opacity="0.2" filter={`url(#${prefix}-nsglow)`} />
        {/* Center hub glow */}
        <circle cx="0" cy="0" r="6" className="fill-blue-400 dark:fill-blue-400" opacity="0.15" filter={`url(#${prefix}-nodeglow)`} />

        {/* Constellation nodes */}
        <circle cx="36" cy="14" r="2.5" className="fill-[#1E3A5F] dark:fill-[#60A5FA]" opacity="0.65" />
        <circle cx="-18" cy="28" r="2.5" className="fill-[#1E3A5F] dark:fill-[#60A5FA]" opacity="0.65" />
        <circle cx="16" cy="34" r="3" className="fill-[#1E3A5F] dark:fill-[#60A5FA]" opacity="0.75" />
        <circle cx="-33" cy="-5" r="3" className="fill-[#1E3A5F] dark:fill-[#60A5FA]" opacity="0.75" />
        <circle cx="33" cy="-20" r="3" className="fill-[#1E3A5F] dark:fill-[#60A5FA]" opacity="0.85" />
        <circle cx="0" cy="0" r="3.5" className="fill-[#2563EB] dark:fill-[#93C5FD]" />
        {/* North Star */}
        <circle cx="0" cy="-38" r="4.5" fill={`url(#${prefix}-ns)`} />
      </g>

      {/* Divider line */}
      <line x1="138" y1="35" x2="138" y2="105" className="stroke-slate-300 dark:stroke-slate-800" strokeWidth="1" opacity="0.5" />

      {/* Wordmark */}
      <text
        x="330"
        y="80"
        textAnchor="middle"
        fontFamily="var(--font-sans), Inter, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
        fontSize="54"
        fontWeight="400"
        letterSpacing="5"
        className="fill-[#0F172A] dark:fill-[#E2E8F0]"
      >
        Astriq
      </text>

      {/* Subtitle */}
      <text
        x="330"
        y="104"
        textAnchor="middle"
        fontFamily="var(--font-sans), Inter, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif"
        fontSize="11"
        fontWeight="300"
        letterSpacing="4"
        className="fill-slate-500 dark:fill-slate-500"
      >
        STAR INTELLIGENCE
      </text>
    </svg>
  );
}
