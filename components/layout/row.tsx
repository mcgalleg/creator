import * as React from "react"
import { cn } from "@/lib/utils"

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  wrap?: boolean
}

const gapClasses = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-10",
}

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
}

const justifyClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
}

function Row({
  className,
  gap = "md",
  align = "center",
  justify = "start",
  wrap = true,
  ...props
}: RowProps) {
  return (
    <div
      data-slot="row"
      className={cn(
        "flex",
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap ? "flex-wrap" : "flex-nowrap",
        className
      )}
      {...props}
    />
  )
}

export { Row }
