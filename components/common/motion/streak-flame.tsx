'use client';

import { Flame } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Flickering flame icon. `lit` controls the warm gradient vs muted. */
export function StreakFlame({
    className,
    lit = true,
}: {
    className?: string;
    lit?: boolean;
}) {
    return (
        <Flame
            className={cn(
                'shrink-0',
                lit
                    ? 'animate-flame fill-[var(--brand-orange)] text-[var(--brand-warning)]'
                    : 'text-muted-foreground',
                className,
            )}
        />
    );
}
