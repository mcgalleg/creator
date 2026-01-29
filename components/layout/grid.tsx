import * as React from "react"
import { cn } from "@/lib/utils"

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
}

// Responsive column classes: 1 col on mobile, 2 on sm, then scale up
const columnsClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  7: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7",
  8: "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8",
  9: "grid-cols-1 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9",
  10: "grid-cols-1 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10",
  11: "grid-cols-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11",
  12: "grid-cols-1 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-12",
}

const gapClasses = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-10",
}

function Grid({
  className,
  columns = 3,
  gap = "lg",
  ...props
}: GridProps) {
  return (
    <div
      data-slot="grid"
      className={cn(
        "grid",
        columnsClasses[columns],
        gapClasses[gap],
        className
      )}
      {...props}
    />
  )
}

export { Grid }
