"use client";

import { useServiceWarmup } from "@/hooks/useServiceWarmup.hook";
import { useIsOffline } from "@/hooks/useOnlineStatus.hook";
import { cn } from "@/lib/utils";
import { warmUpServices } from "@/lib/service-warmup";
import { PlugZap, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * A warm server wakes in milliseconds, and flashing a banner for that would be
 * noise. Only a wait long enough for the learner to have noticed it earns one.
 */
const SHOW_AFTER_MS = 2_500;

/**
 * "The server is waking up", said plainly.
 *
 * Without this, a cold start looked like a broken app: widgets sat empty with no
 * explanation and nothing to do. Naming the wait — and giving it an end — turns
 * a bug report into a short pause. Copy stays short and blame-free; the learner
 * has done nothing wrong.
 */
export default function WakingBanner() {
    const { state, startedAt } = useServiceWarmup();
    const offline = useIsOffline();
    // Keyed to the wake it belongs to rather than a plain boolean, so a new
    // wake resets the grace period by itself — no clearing pass in the effect.
    const [shownForWake, setShownForWake] = useState<number | null>(null);

    useEffect(() => {
        if (state !== "waking" || startedAt === null) return;

        // Measured from when the wake started, not from this render: a wake
        // already running for a while when this mounts should show at once
        // rather than restart the grace period.
        const delay = Math.max(SHOW_AFTER_MS - (Date.now() - startedAt), 0);
        const timeout = setTimeout(() => setShownForWake(startedAt), delay);

        return () => clearTimeout(timeout);
    }, [state, startedAt]);

    const visible =
        state === "waking" && startedAt !== null && shownForWake === startedAt;

    // Offline has its own banner, and it is the more useful message — practice
    // works offline, whereas nothing can be done about a server this device
    // cannot reach.
    if (offline) return null;
    if (state === "waking" && !visible) return null;
    if (state !== "waking" && state !== "failed") return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                "glass-surface sticky top-0 z-40 flex items-center justify-center gap-2",
                "px-4 py-2 text-xs font-medium text-muted-foreground",
            )}
        >
            {state === "waking" ? (
                <>
                    <RefreshCw
                        className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none"
                        aria-hidden
                    />
                    <span>
                        Waking the server — this can take up to a minute.
                    </span>
                </>
            ) : (
                <>
                    <PlugZap className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>The server didn&apos;t wake up.</span>
                    <button
                        type="button"
                        onClick={() => void warmUpServices()}
                        className="underline underline-offset-2 hover:text-foreground"
                    >
                        Try again
                    </button>
                </>
            )}
        </div>
    );
}
