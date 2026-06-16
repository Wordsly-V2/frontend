import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border bg-card/40 px-6 py-14 text-center',
                className,
            )}
        >
            {Icon && (
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl gradient-brand text-primary-foreground shadow-md animate-pop">
                    <Icon className="h-8 w-8" />
                </div>
            )}
            <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-lg font-bold">{title}</h3>
                {description && (
                    <p className="mx-auto max-w-sm text-sm text-muted-foreground text-balance">
                        {description}
                    </p>
                )}
            </div>
            {action && <div className="mt-1">{action}</div>}
        </div>
    );
}
