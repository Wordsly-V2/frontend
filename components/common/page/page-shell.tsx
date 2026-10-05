import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const WIDTHS = {
    /** Reading pages and forms: profile, a unit, difficult words. */
    narrow: "max-w-3xl",
    /** Lists you work down: a course, a unit, a course being edited. */
    medium: "max-w-4xl",
    /** Most pages. */
    default: "max-w-6xl",
} as const;

interface PageShellProps {
    width?: keyof typeof WIDTHS;
    className?: string;
    children: ReactNode;
}

/**
 * The content column of a page inside the app frame: one width scale and one
 * set of gutters, so every page lines up under the sidebar and the mobile
 * top bar the same way. Pages keep their own `<main>` through this.
 */
export function PageShell({ width = "default", className, children }: Readonly<PageShellProps>) {
    return (
        <main className={cn("mx-auto w-full px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8", WIDTHS[width], className)}>
            {children}
        </main>
    );
}
