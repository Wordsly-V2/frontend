import { cn } from "@/lib/utils";

/** A run's progress bar, drawn like the Path tab's (no Progress primitive here). */
export function SyncProgressBar({
    percent,
    label,
    className,
}: Readonly<{ percent: number; label: string; className?: string }>) {
    return (
        <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
            className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}
        >
            <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${percent}%` }}
            />
        </div>
    );
}
