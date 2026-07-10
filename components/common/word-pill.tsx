import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Soft "pill" used for part-of-speech tags and small inline counts across the
 * app (`bg-primary/10 text-primary`, rounded). Replaces the ~10 ad-hoc copies
 * that each hand-rolled slightly different padding/rounding. Colors come from
 * the theme `primary` token — never hardcode.
 */
const wordPillVariants = cva(
    "inline-flex items-center bg-primary/10 text-primary whitespace-nowrap",
    {
        variants: {
            size: {
                sm: "px-2 py-0.5 text-xs",
                md: "px-3 py-1 text-xs font-semibold",
            },
            shape: {
                pill: "rounded-full",
                rounded: "rounded",
            },
        },
        defaultVariants: {
            size: "sm",
            shape: "pill",
        },
    },
);

export interface WordPillProps
    extends React.ComponentProps<"span">,
        VariantProps<typeof wordPillVariants> {}

export function WordPill({ className, size, shape, ...props }: WordPillProps) {
    return (
        <span className={cn(wordPillVariants({ size, shape }), className)} {...props} />
    );
}

export { wordPillVariants };
