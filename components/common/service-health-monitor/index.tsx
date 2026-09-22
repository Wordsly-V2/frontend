"use client";

import { healthCheck, pingApiGateway, ServiceHealth } from "@/apis/app.api";
import {
    reportNetworkFailure,
    reportNetworkSuccess,
    startOnlineStatusTracking,
} from "@/lib/offline/online-status";
import { isLikelyCold, warmUpServices } from "@/lib/service-warmup";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Comfortably under the ~15 minutes of idleness after which the platform
 * suspends an instance. A learner reading a word list with the tab open should
 * never come back to a cold server.
 */
const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

/** Names already reported, so a ten-minute loop can't nag about the same thing. */
const reported = new Set<string>();

function notifyUnhealthyServices(services: ServiceHealth[]) {
    for (const service of services) {
        if (service.status === "unhealthy") {
            if (reported.has(service.name)) continue;
            reported.add(service.name);
            toast.warning(`${service.name} is unhealthy`, {
                description: service.message,
            });
        } else {
            // Recovered — worth warning about again if it breaks later.
            reported.delete(service.name);
        }
    }
}

/**
 * The keep-alive beat: cheap, and only ever run against a server believed awake.
 *
 * Deliberately not a wake. A wake is slow by design and belongs at the moments
 * we have reason to think the server is cold; running one every ten minutes
 * would spend a long request to learn what a 50ms one already tells us.
 */
async function heartbeat(): Promise<void> {
    try {
        await pingApiGateway();
        reportNetworkSuccess();
    } catch {
        reportNetworkFailure();
        return;
    }

    // Only after the ping succeeded: on a booting server every service reads as
    // unhealthy, and toasting that at the learner was pure noise about a
    // condition that resolves itself.
    healthCheck().then(notifyUnhealthyServices).catch(() => undefined);
}

/**
 * Owns every trigger that boots or keeps the backend awake.
 *
 * The free tier suspends instances after a spell of inactivity, so "is the
 * server up?" is a question this app has to keep asking. Three moments matter:
 *
 * - **Boot.** Wake immediately, not on a timer. Everything going through the
 *   shared axios instance waits on that same wake (`lib/service-warmup.ts`), so
 *   the page's own queries no longer race it and lose.
 * - **Coming back.** A tab restored after a break is looking at a server that
 *   has very likely been suspended since. Wake before the learner's first click
 *   discovers it.
 * - **Staying.** While the tab is visible, a cheap ping every ten minutes keeps
 *   the instance from being suspended out from under an active learner.
 *
 * A hidden tab beats nothing: it cannot help a learner who isn't there, and on
 * a metered free tier it spends instance hours that an active one needs.
 */
export default function ServiceHealthMonitor() {
    useEffect(() => {
        startOnlineStatusTracking();

        let cancelled = false;

        // Boot: the wake first, the heartbeat once there is something to check.
        void warmUpServices().finally(() => {
            if (!cancelled) void heartbeat();
        });

        const beat = () => {
            if (document.visibilityState !== "visible") return;
            void heartbeat();
        };

        const interval = setInterval(beat, KEEP_ALIVE_INTERVAL_MS);

        const onVisible = () => {
            if (document.visibilityState !== "visible") return;
            // `isLikelyCold` is about elapsed time since anything last reached
            // the API, so a tab that was merely behind another window for a
            // moment gets the cheap path.
            if (isLikelyCold()) {
                void warmUpServices();
            } else {
                void heartbeat();
            }
        };

        document.addEventListener("visibilitychange", onVisible);

        return () => {
            cancelled = true;
            clearInterval(interval);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, []);

    return null;
}
