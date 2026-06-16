import { cn } from '@/lib/utils';

/** Base shimmer block. Composes via className. */
export function Skeleton({
    className,
    ...props
}: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="skeleton"
            className={cn('animate-pulse rounded-xl bg-muted/70', className)}
            {...props}
        />
    );
}

export function SkeletonStatPill({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'flex flex-col gap-2 rounded-2xl border-2 border-border bg-card p-4',
                className,
            )}
        >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
        </div>
    );
}

export function SkeletonCard({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 rounded-3xl border-2 border-border bg-card p-5',
                className,
            )}
        >
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
    );
}

export function SkeletonList({
    rows = 5,
    className,
}: {
    rows?: number;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-4"
                >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonGrid({
    count = 6,
    className,
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
                className,
            )}
        >
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
