import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
    title: ReactNode;
    /** Small uppercase label above the title. */
    eyebrow?: ReactNode;
    description?: ReactNode;
    /** Buttons on the right (below the text on small screens). */
    actions?: ReactNode;
    /** A back link above everything (`BackLink`). */
    back?: ReactNode;
    className?: string;
}

/** The one way a page names itself: back link, eyebrow, title, description, actions. */
export function PageHeader({ title, eyebrow, description, actions, back, className }: Readonly<PageHeaderProps>) {
    return (
        <header className={cn("mb-6 sm:mb-8", className)}>
            {back && <div className="-ml-3 mb-3">{back}</div>}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    {eyebrow && (
                        // Below lg the mobile top bar already names the section.
                        <p className="mb-1 hidden text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground lg:block">
                            {eyebrow}
                        </p>
                    )}
                    <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                    {description && (
                        <div className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</div>
                    )}
                </div>
                {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
            </div>
        </header>
    );
}
