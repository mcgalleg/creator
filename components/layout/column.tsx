import * as React from "react"
import { cn } from "@/lib/utils"

export interface ColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
  align?: "start" | "center" | "end" | "stretch"
}

const gapClasses = {
  none: "",
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
}

function Column({
  className,
  gap = "lg",
  align = "stretch",
  ...props
}: ColumnProps) {
  return (
    <div
      data-slot="column"
      className={cn(
        "flex flex-col",
        gapClasses[gap],
        alignClasses[align],
        className
      )}
      {...props}
    />
  )
}

export { Column }
