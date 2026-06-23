import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ChartCardProps {
    title: string;
    subtitle?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}

/** Consistent card shell for the report's chart sections. */
export function ChartCard({
    title,
    subtitle,
    action,
    children,
    className,
}: Readonly<ChartCardProps>) {
    return (
        <section
            className={cn(
                "rounded-2xl border border-border bg-card p-4 sm:p-5",
                className,
            )}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-foreground">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}
