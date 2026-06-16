import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition-[color,box-shadow,background,border,transform] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/45 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/92 hover:shadow-md",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 shadow-sm",
        outline:
          "border border-border/80 bg-background/80 shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-card/50 dark:border-border dark:hover:bg-accent/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/85 shadow-xs",
        ghost:
          "hover:bg-accent/80 hover:text-accent-foreground dark:hover:bg-accent/40",
        link: "text-primary underline-offset-4 hover:underline shadow-none active:scale-100",
        // Playful 3D "pressable" variants — chunky bottom border that sinks on press
        play:
          "bg-primary text-primary-foreground font-extrabold uppercase tracking-wide border-b-4 border-[var(--primary-shadow)] hover:brightness-[1.04] active:translate-y-[3px] active:border-b-0 active:scale-100",
        playSecondary:
          "bg-secondary text-secondary-foreground font-extrabold border-b-4 border-border hover:brightness-[0.98] active:translate-y-[2px] active:border-b-0 active:scale-100",
        playOutline:
          "bg-card text-foreground font-bold border-2 border-b-4 border-border hover:bg-accent/50 active:translate-y-[2px] active:border-b-2 active:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-2xl px-6 text-base has-[>svg]:px-4",
        xl: "h-14 rounded-2xl px-8 text-base has-[>svg]:px-6",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
