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
      viewBox="0 0 100 100"
      role="img"
      aria-label="Astriq"
      className={className}
    >
      {/* Rising pulse line */}
      <polyline
        points="22,70 32,66 40,61 47,52 54,56 61,38 68,31 75,20"
        fill="none"
        className="stroke-[#111111] dark:stroke-white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      <circle cx="40" cy="61" r="1.6" className="fill-[#111111] dark:fill-white" />
      <circle cx="47" cy="52" r="1.6" className="fill-[#111111] dark:fill-white" />
      <circle cx="54" cy="56" r="1.6" className="fill-[#111111] dark:fill-white" />
      <circle cx="61" cy="38" r="1.6" className="fill-[#111111] dark:fill-white" />
      <circle cx="68" cy="31" r="1.6" className="fill-[#111111] dark:fill-white" />

      {/* Star */}
      <g transform="translate(75, 20)">
        <path d="M0,-10 C0.4,-2.5 2.5,-0.4 10,0 C2.5,0.4 0.4,2.5 0,10 C-0.4,2.5 -2.5,0.4 -10,0 C-2.5,-0.4 -0.4,-2.5 0,-10Z" className="fill-[#111111] dark:fill-white" />
      </g>
    </svg>
  );
}

function AstriqCombo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 100"
      role="img"
      aria-label="Astriq"
      className={className}
    >
      {/* Icon */}
      <polyline
        points="22,70 32,66 40,61 47,52 54,56 61,38 68,31 75,20"
        fill="none"
        className="stroke-[#111111] dark:stroke-white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="40" cy="61" r="1.6" className="fill-[#111111] dark:fill-white" />
      <circle cx="47" cy="52" r="1.6" className="fill-[#111111] dark:fill-white" />
      <circle cx="54" cy="56" r="1.6" className="fill-[#111111] dark:fill-white" />
      <circle cx="61" cy="38" r="1.6" className="fill-[#111111] dark:fill-white" />
      <circle cx="68" cy="31" r="1.6" className="fill-[#111111] dark:fill-white" />

      <g transform="translate(75, 20)">
        <path d="M0,-10 C0.4,-2.5 2.5,-0.4 10,0 C2.5,0.4 0.4,2.5 0,10 C-0.4,2.5 -2.5,0.4 -10,0 C-2.5,-0.4 -0.4,-2.5 0,-10Z" className="fill-[#111111] dark:fill-white" />
      </g>

      {/* Wordmark */}
      <g transform="translate(112, 0)">
        <text
          y="55"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="40"
          fontWeight="400"
          letterSpacing="4"
          className="fill-[#111111] dark:fill-white"
        >
          ASTRIQ
        </text>
        <text
          x="2"
          y="70"
          fontFamily="var(--font-sans), 'SF Pro Display', Inter, 'Helvetica Neue', sans-serif"
          fontSize="9"
          fontWeight="500"
          letterSpacing="5.5"
          className="fill-[#555555] dark:fill-[#888888]"
        >
          STAR INTELLIGENCE
        </text>
      </g>
    </svg>
  );
}
