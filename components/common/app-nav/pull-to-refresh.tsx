"use client";

import { useIsOffline } from "@/hooks/useOnlineStatus.hook";
import { cn } from "@/lib/utils";
import { classifyPull, PULL_THRESHOLD, pullDistance, pullProgress } from "@/lib/pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Keep the spinner up at least this long, so a fast refetch still reads as one. */
const MIN_SPIN_MS = 600;

/** True when the touch started inside something that is itself scrolled down. */
function startsInScrolledBox(target: EventTarget | null): boolean {
    let el = target instanceof Element ? target : null;
    while (el && el !== document.body) {
        if (el.scrollTop > 0) {
            const { overflowY } = getComputedStyle(el);
            if (overflowY === "auto" || overflowY === "scroll") return true;
        }
        el = el.parentElement;
    }
    return false;
}

function canStartPull(event: TouchEvent): boolean {
    if (event.touches.length !== 1 || window.scrollY > 0) return false;
    // A dialog or sheet is open (Radix locks the page scroll), or the touch is
    // on something that opted out.
    if (document.body.hasAttribute("data-scroll-locked")) return false;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("[role=dialog],[data-pull-refresh=off],input,textarea,select")) return false;
    return !startsInScrolledBox(event.target);
}

/**
 * Pull down at the top of a page to refetch what it shows. Touch only, and
 * only inside the app frame: focus routes (practice, lessons, tests) never
 * mount it, so a stray pull can't throw away a session.
 *
 * It refetches the active queries rather than reloading the page, so the app
 * shell, the offline cache and any half-typed form stay as they are.
 */
export function PullToRefresh() {
    const queryClient = useQueryClient();
    const isOffline = useIsOffline();
    const reduceMotion = useReducedMotion();
    const [distance, setDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Read from the touch handlers, which are bound once.
    const offlineRef = useRef(isOffline);
    const refreshingRef = useRef(false);
    useEffect(() => {
        offlineRef.current = isOffline;
    }, [isOffline]);

    useEffect(() => {
        if (!globalThis.matchMedia?.("(pointer: coarse)").matches) return;

        let start: { x: number; y: number } | null = null;
        let mode: "pull" | "other" | null = null;
        let current = 0;

        const reset = () => {
            start = null;
            mode = null;
            current = 0;
        };

        const refresh = async () => {
            if (offlineRef.current) {
                toast.info("You're offline. Showing your saved copy.");
                return;
            }
            refreshingRef.current = true;
            setRefreshing(true);
            try {
                await Promise.all([
                    queryClient.refetchQueries({ type: "active" }),
                    new Promise((resolve) => setTimeout(resolve, MIN_SPIN_MS)),
                ]);
            } finally {
                refreshingRef.current = false;
                setRefreshing(false);
            }
        };

        const onStart = (event: TouchEvent) => {
            reset();
            if (refreshingRef.current || !canStartPull(event)) return;
            const touch = event.touches[0];
            start = { x: touch.clientX, y: touch.clientY };
        };

        const onMove = (event: TouchEvent) => {
            if (!start || mode === "other") return;
            const touch = event.touches[0];
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (mode === null) {
                mode = classifyPull(dx, dy);
                if (mode !== "pull") return;
            }
            // Ours now: stop the browser's own pull-to-refresh and bounce.
            if (event.cancelable) event.preventDefault();
            current = pullDistance(dy);
            setDistance(current);
        };

        const onEnd = () => {
            const armed = mode === "pull" && current >= PULL_THRESHOLD;
            reset();
            setDistance(0);
            if (armed) void refresh();
        };

        window.addEventListener("touchstart", onStart, { passive: true });
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onEnd);
        window.addEventListener("touchcancel", onEnd);
        return () => {
            window.removeEventListener("touchstart", onStart);
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onEnd);
            window.removeEventListener("touchcancel", onEnd);
        };
    }, [queryClient]);

    const pulling = distance > 0;
    if (!pulling && !refreshing) return null;

    const progress = refreshing ? 1 : pullProgress(distance);
    const offset = refreshing ? PULL_THRESHOLD : distance;

    return (
        <div
            role="status"
            aria-live="polite"
            className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-[env(safe-area-inset-top)]"
        >
            <span className="sr-only">{refreshing ? "Refreshing" : "Pull to refresh"}</span>
            <div
                className={cn(
                    "glass-surface flex size-10 items-center justify-center rounded-full border border-border shadow-md",
                    !pulling && !reduceMotion && "transition-transform duration-200",
                )}
                style={{ transform: `translateY(${offset - 40}px)`, opacity: Math.max(0.3, progress) }}
            >
                <RefreshCw
                    aria-hidden
                    className={cn(
                        "size-5",
                        progress >= 1 ? "text-primary" : "text-muted-foreground",
                        refreshing && !reduceMotion && "animate-spin",
                    )}
                    style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
                />
            </div>
        </div>
    );
}
