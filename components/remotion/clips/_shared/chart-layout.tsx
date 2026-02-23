import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import type { YScale } from "./svg-chart";
import { mapToY } from "./svg-chart";
import { formatCompact } from "./format";
import { DARK } from "./palette";
import { heading48 } from "./typography";

// =============================================================================
// Shared SVG chart dimensions
// =============================================================================

export const SVG_W = 1824;
export const SVG_H = 880;
export const PAD_X = 48;
export const PAD_Y = 40;
export const CHART_LEFT = PAD_X + 80; // Extra room for larger y-axis labels
export const CHART_RIGHT = SVG_W - PAD_X;
export const CHART_TOP = PAD_Y;
export const CHART_BOTTOM = SVG_H - PAD_Y - 20; // Extra room for larger x-axis labels
export const CHART_W = CHART_RIGHT - CHART_LEFT;
export const CHART_H = CHART_BOTTOM - CHART_TOP;

// =============================================================================
// Grid lines + Y-axis labels
// =============================================================================

export function ChartGridLines({ scale }: { scale: YScale }) {
  return (
    <>
      {scale.ticks.map((tick, i) => {
        const y = mapToY(tick, scale, CHART_H, 0) + CHART_TOP;
        return (
          <g key={`grid-${i}`}>
            <line
              x1={CHART_LEFT}
              y1={y}
              x2={CHART_RIGHT}
              y2={y}
              stroke={DARK.border}
              strokeWidth={1}
            />
            <text
              x={CHART_LEFT - 16}
              y={y + 8}
              textAnchor="end"
              fill={DARK.mutedFg}
              fontSize={26}
              fontFamily="var(--font-mono), monospace"
            >
              {formatCompact(tick)}
            </text>
          </g>
        );
      })}
    </>
  );
}

// =============================================================================
// X-axis labels
// =============================================================================

interface XAxisLabelsProps {
  data: Record<string, string | number>[];
  xKey: string;
  /** Max labels to show (rest are skipped to avoid overlap) */
  maxLabels?: number;
}

export function ChartXAxisLabels({ data, xKey, maxLabels }: XAxisLabelsProps) {
  const count = data.length;
  return (
    <>
      {data.map((row, i) => {
        // Skip labels to avoid overlap when maxLabels is specified
        if (maxLabels && count > maxLabels) {
          const showLabel =
            i % Math.ceil(count / maxLabels) === 0 || i === count - 1;
          if (!showLabel) return null;
        }
        const x =
          CHART_LEFT +
          (count > 1 ? (i / (count - 1)) * CHART_W : CHART_W / 2);
        return (
          <text
            key={`x-${i}`}
            x={x}
            y={CHART_BOTTOM + 36}
            textAnchor="middle"
            fill={DARK.mutedFg}
            fontSize={16}
            fontFamily="var(--font-mono), monospace"
          >
            {String(row[xKey])}
          </text>
        );
      })}
    </>
  );
}

// =============================================================================
// Legend
// =============================================================================

interface ChartLegendProps {
  items: { label: string; color: string }[];
}

export function ChartLegend({ items }: ChartLegendProps) {
  if (items.length <= 1) return null;
  return (
    <>
      {items.map((item, i) => (
        <g key={`legend-${i}`}>
          <circle
            cx={CHART_RIGHT - 200}
            cy={CHART_TOP + i * 44}
            r={8}
            fill={item.color}
          />
          <text
            x={CHART_RIGHT - 184}
            y={CHART_TOP + i * 44 + 9}
            fill={DARK.mutedFg}
            fontSize={26}
            fontFamily="var(--font-sans), system-ui, sans-serif"
          >
            {item.label}
          </text>
        </g>
      ))}
    </>
  );
}

// =============================================================================
// Outer chart wrapper — AbsoluteFill + optional title + SVG container
// =============================================================================

interface ChartLayoutProps {
  title?: string;
  children: ReactNode;
}

export function ChartLayout({ title, children }: ChartLayoutProps) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK.bg,
        padding: 48,
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      {title && (
        <div
          style={{
            ...heading48,
            color: DARK.foreground,
            marginBottom: 24,
          }}
        >
          {title}
        </div>
      )}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: "100%", flex: 1 }}
      >
        {children}
      </svg>
    </AbsoluteFill>
  );
}
