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
  if (variant === "icon") {
    return <AstriqIcon className={cn(SIZES[size], "w-auto", className)} />;
  }

  return <AstriqCombo className={cn(SIZES[size], "w-auto", className)} />;
}

function AstriqIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      role="img"
      aria-label="Astriq"
      className={className}
    >
      {/* 6 Arms */}
      <g className="stroke-[#0F172A] dark:stroke-white" strokeWidth="5.5" strokeLinecap="round" fill="none">
        <line x1="100" y1="100" x2="100" y2="42" />
        <line x1="100" y1="100" x2="150.2" y2="71" />
        <line x1="100" y1="100" x2="150.2" y2="129" />
        <line x1="100" y1="100" x2="100" y2="158" />
        <line x1="100" y1="100" x2="49.8" y2="129" />
        <line x1="100" y1="100" x2="49.8" y2="71" />
      </g>

      {/* Tip dots */}
      <circle cx="100" cy="38" r="4.5" className="fill-[#0F172A] dark:fill-white" />
      <circle cx="153" cy="69" r="3.5" className="fill-[#0F172A] dark:fill-white" />
      <circle cx="153" cy="131" r="3.5" className="fill-[#0F172A] dark:fill-white" />
      <circle cx="100" cy="162" r="4.5" className="fill-[#0F172A] dark:fill-white" />
      <circle cx="47" cy="131" r="3.5" className="fill-[#0F172A] dark:fill-white" />
      <circle cx="47" cy="69" r="3.5" className="fill-[#0F172A] dark:fill-white" />

      {/* Center dot */}
      <circle cx="100" cy="100" r="5.5" className="fill-[#0F172A] dark:fill-white" />
    </svg>
  );
}

function AstriqCombo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 140"
      role="img"
      aria-label="Astriq"
      className={className}
    >
      {/* Asterisk Icon */}
      <g transform="translate(72, 70)">
        {/* 6 Arms */}
        <g className="stroke-[#0F172A] dark:stroke-white" strokeWidth="3.8" strokeLinecap="round" fill="none">
          <line x1="0" y1="0" x2="0" y2="-40" />
          <line x1="0" y1="0" x2="34.6" y2="-20" />
          <line x1="0" y1="0" x2="34.6" y2="20" />
          <line x1="0" y1="0" x2="0" y2="40" />
          <line x1="0" y1="0" x2="-34.6" y2="20" />
          <line x1="0" y1="0" x2="-34.6" y2="-20" />
        </g>

        {/* Tip dots */}
        <circle cx="0" cy="-43" r="3" className="fill-[#0F172A] dark:fill-white" />
        <circle cx="37" cy="-21.5" r="2.5" className="fill-[#0F172A] dark:fill-white" />
        <circle cx="37" cy="21.5" r="2.5" className="fill-[#0F172A] dark:fill-white" />
        <circle cx="0" cy="43" r="3" className="fill-[#0F172A] dark:fill-white" />
        <circle cx="-37" cy="21.5" r="2.5" className="fill-[#0F172A] dark:fill-white" />
        <circle cx="-37" cy="-21.5" r="2.5" className="fill-[#0F172A] dark:fill-white" />

        {/* Center dot */}
        <circle cx="0" cy="0" r="4" className="fill-[#0F172A] dark:fill-white" />
      </g>

      {/* Divider line */}
      <line x1="120" y1="35" x2="120" y2="105" className="stroke-slate-300 dark:stroke-slate-800" strokeWidth="1" opacity="0.5" />

      {/* Wordmark */}
      <text
        x="270"
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
        x="270"
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
