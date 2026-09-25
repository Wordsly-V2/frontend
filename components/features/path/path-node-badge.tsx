import { cn } from "@/lib/utils";
import type { PathNodeState } from "@/types/path/path.type";
import { Check, Lock } from "lucide-react";

/**
 * The round marker of a unit or lesson on the path: a tick when done, a lock
 * when not reachable yet, otherwise its number.
 */
export function PathNodeBadge({
    state,
    label,
    current = false,
    size = "md",
    className,
}: {
    state: PathNodeState;
    /** Shown while the node is available (usually its order). */
    label: React.ReactNode;
    /** The node the learner should take next: drawn brighter. */
    current?: boolean;
    size?: "sm" | "md";
    className?: string;
}) {
    const sizes = size === "sm" ? "h-9 w-9 text-sm" : "h-12 w-12 text-base";
    const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

    return (
        <div
            aria-hidden
            className={cn(
                "flex shrink-0 items-center justify-center rounded-full font-display font-bold",
                sizes,
                state === "completed" &&
                    "bg-[var(--brand-success)] text-white shadow-md",
                state === "available" &&
                    (current
                        ? "gradient-brand text-primary-foreground shadow-md glow-primary"
                        : "border-2 border-primary/40 bg-primary/10 text-primary"),
                state === "locked" &&
                    "border-2 border-dashed border-border bg-muted text-muted-foreground",
                className,
            )}
        >
            {state === "completed" && <Check className={icon} strokeWidth={3} />}
            {state === "locked" && <Lock className={icon} />}
            {state === "available" && label}
        </div>
    );
}
