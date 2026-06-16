import { RotateCcw, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
    retryLabel = 'Try again',
    className,
}: {
    title?: string;
    message?: string;
    onRetry?: () => void;
    retryLabel?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-destructive/30 bg-destructive/5 px-6 py-12 text-center',
                className,
            )}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
                <TriangleAlert className="h-7 w-7" />
            </div>
            <div className="flex flex-col gap-1">
                <h3 className="font-display text-lg font-bold">{title}</h3>
                {message && (
                    <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                        {message}
                    </p>
                )}
            </div>
            {onRetry && (
                <Button variant="playOutline" onClick={onRetry} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    {retryLabel}
                </Button>
            )}
        </div>
    );
}
