import { request } from '@/lib/axios';
import axios from 'axios';
import { getBootstrapServiceUrls } from '@/lib/bootstrap-services';

export type ServiceHealth = {
    name: string;
    status: 'healthy' | 'unhealthy';
    message: string;
};

export type ServiceWake = {
    name: string;
    state: 'awake' | 'down';
    ms: number;
};

export type WakeResult = {
    /** True only when every service behind the gateway answered. */
    ready: boolean;
    services: ServiceWake[];
};

/**
 * Generous on purpose: this call pays for the cold start.
 *
 * Two boots can stack behind it — the gateway's own, which the platform spends
 * before a single line of gateway code runs, and then the gateway's fan-out to
 * three sleeping services. The gateway caps its fan-out well below this so it
 * can answer with partial progress rather than having this socket time out.
 */
const WAKE_TIMEOUT_MS = 120_000;

/** Long enough to cover a boot; the nudge is abandoned, never the boot. */
const NUDGE_TIMEOUT_MS = 90_000;

/**
 * Start every service booting at once, without waiting for any of them.
 *
 * `mode: 'no-cors'` on purpose. The services answer only the gateway, so they
 * send no CORS headers for this origin and the browser hands back an opaque
 * response we cannot read — which is fine, because reading it is not the point.
 * The request still reaches the platform's router, and that is what starts the
 * container. Readiness remains the gateway's `/wake` to report; this only makes
 * sure the four cold starts overlap instead of stacking end to end.
 *
 * Fire-and-forget by design: awaiting these would reintroduce the very wait it
 * exists to remove, and an abort here does not stop a boot already underway.
 */
export function nudgeServicesAwake(): void {
    for (const url of getBootstrapServiceUrls()) {
        void fetch(`${url}/health`, {
            mode: 'no-cors',
            cache: 'no-store',
            // Liveness: the cheapest endpoint that still forces the container up.
            signal: AbortSignal.timeout(NUDGE_TIMEOUT_MS),
        }).catch(() => undefined);
    }
}

function getApiUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL is not configured');
    }
    return apiUrl;
}

/**
 * Boot the gateway and everything behind it.
 *
 * Deliberately outside the shared axios instance: it runs before anyone is
 * signed in, must never trigger the 401/refresh machinery, and must not be
 * queued behind the warm-up gate that instance applies (it *is* the warm-up).
 */
export const wakeServices = async (): Promise<WakeResult> => {
    const response = await axios.get<WakeResult>(`${getApiUrl()}/wake`, {
        timeout: WAKE_TIMEOUT_MS,
        withCredentials: false,
    });

    return response.data;
};

/** Short timeout for the reachability probe — this one must fail fast. */
const REACHABILITY_TIMEOUT_MS = 8_000;

/**
 * Is the gateway reachable? Unauthenticated and deliberately outside the shared
 * axios instance, so a probe can never trigger the 401/refresh machinery.
 * Rejects when it isn't reachable — that rejection is the signal.
 */
export const pingApiGateway = async (): Promise<void> => {
    // `/health` on the gateway is a constant string; `/ping` fans out a
    // readiness probe to all three services and `/wake` boots them. This runs
    // on a timer while the learner is offline, so it must stay the cheap one.
    try {
        await axios.get(`${getApiUrl()}/health`, {
            timeout: REACHABILITY_TIMEOUT_MS,
            withCredentials: false,
        });
    } catch (error) {
        // Any HTTP answer at all — including the 502/503 a platform edge serves
        // while it boots the instance — proves the network path is fine, which
        // is the only question this probe asks. Without this, a cold start read
        // as "offline" and dropped the whole app into offline mode.
        if (axios.isAxiosError(error) && error.response) return;
        throw error;
    }
};

export const healthCheck = (): Promise<ServiceHealth[]> =>
    request((i) => i.get('/ping'));
