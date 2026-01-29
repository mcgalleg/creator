import * as React from "react"
import { cn } from "@/lib/utils"

export interface ColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
  align?: "start" | "center" | "end" | "stretch"
}

const gapClasses = {
  none: "",
  xs: "[&>*+*]:mt-2",
  sm: "[&>*+*]:mt-4",
  md: "[&>*+*]:mt-6",
  lg: "[&>*+*]:mt-8",
  xl: "[&>*+*]:mt-10",
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
