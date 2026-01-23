import * as React from "react"

import { cn } from "@/lib/utils"

type LoadingSpinnerProps = React.ComponentPropsWithoutRef<"output"> & {
  size?: "sm" | "md" | "lg"
  label?: string
  showLabel?: boolean
  showIcon?: boolean
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps["size"]>, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-7 w-7 border-2",
}

function LoadingSpinner({
  size = "md",
  label = "Loading...",
  showLabel = true,
  showIcon = true,
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <output
      aria-live="polite"
      className={cn("flex items-center gap-3 text-sm text-slate-500", className)}
      {...props}
    >
      {showIcon && <span
        aria-hidden="true"
        className={cn(
          "inline-flex animate-spin rounded-full border-slate-300 border-t-slate-600",
          sizeClasses[size]
        )}
      />}
      {showLabel && <span>{label}</span>}
    </output>
  )
}

export { LoadingSpinner }
