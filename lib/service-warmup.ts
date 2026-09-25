import {
	nudgeServicesAwake,
	wakeServices,
	type WakeResult,
} from '@/apis/app.api';
import { isOffline } from '@/lib/offline/online-status';

export type WarmupState =
	/** No evidence either way — nothing has been asked of the API yet. */
	| 'unknown'
	/** A wake is in flight. Real requests wait for it rather than failing. */
	| 'waking'
	/** Something answered recently, so the instances are up. */
	| 'ready'
	/** The wake ran out of attempts. Requests stop waiting and just try. */
	| 'failed';

export type WarmupSnapshot = {
	state: WarmupState;
	/** Per-service detail from the last completed wake, for the banner. */
	progress: WakeResult | null;
	/** When the wake started, so the UI can hold the banner back briefly. */
	startedAt: number | null;
};

/**
 * Cold-start coordination.
 *
 * The problem this solves: on a platform that suspends idle instances, the first
 * page load after a quiet spell fires twenty queries at a container that does
 * not exist yet. They all fail within seconds, and — because the load that woke
 * the server is the one that failed — the learner is left staring at empty
 * widgets on a server that is now perfectly healthy.
 *
 * A wake is only an external call that starts the services booting. It never
 * holds a request: gating the app on it meant one broken service kept every
 * page on "Loading…". Requests go out at once, and the ones that land on a
 * booting instance are carried by the query retry policy (`lib/queryClient.ts`)
 * and the platform, which holds a connection while the container starts. There
 * is exactly one wake in flight at a time, and the banner reports on it.
 */

/**
 * Idle instances are suspended after ~15 minutes. Staying under that means a
 * learner coming back from a coffee break gets a wake rather than a failure.
 */
const COLD_AFTER_MS = 13 * 60_000;

/** Wake attempts before giving up. */
const WAKE_ATTEMPTS = 3;

/**
 * How long after a wake finishes a failed request may not start another.
 *
 * A wake has just told us which services are up. A 502 from one it found down
 * means that service is broken, and a fresh wake would hold every request in
 * the app for another full gateway budget to learn the same thing again.
 */
const REWAKE_COOLDOWN_MS = 2 * 60_000;

let snapshot: WarmupSnapshot = {
	state: 'unknown',
	progress: null,
	startedAt: null,
};
let listeners = new Set<() => void>();
let inFlight: Promise<boolean> | null = null;
let lastSuccessAt = 0;
let lastWakeEndedAt = 0;

function emit(next: Partial<WarmupSnapshot>): void {
	// Replaced rather than mutated: useSyncExternalStore compares by identity,
	// so an in-place edit would never re-render the banner.
	snapshot = { ...snapshot, ...next };
	for (const listener of listeners) listener();
}

export function getWarmupSnapshot(): WarmupSnapshot {
	return snapshot;
}

/** Server snapshot for useSyncExternalStore — there is no warm-up during SSR. */
export function getServerWarmupSnapshot(): WarmupSnapshot {
	return SERVER_SNAPSHOT;
}

const SERVER_SNAPSHOT: WarmupSnapshot = {
	state: 'unknown',
	progress: null,
	startedAt: null,
};

export function subscribeToWarmup(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/**
 * Record that the API just answered. The strongest possible evidence that the
 * instances are awake, and what the idle clock is measured from.
 */
export function noteServiceActivity(): void {
	lastSuccessAt = Date.now();
	if (snapshot.state !== 'ready') {
		emit({ state: 'ready', startedAt: null });
	}
}

/** True when nothing has reached the API recently enough to still be warm. */
export function isLikelyCold(): boolean {
	return Date.now() - lastSuccessAt > COLD_AFTER_MS;
}

/**
 * Boot the services, or join the boot already in progress.
 *
 * Resolves true once everything answered. Safe to call from anywhere, as often
 * as you like — concurrent callers share one fan-out.
 */
export function warmUpServices(): Promise<boolean> {
	if (inFlight) return inFlight;

	// Nothing to wake if the problem is on this end. Offline mode has its own
	// recovery probe and its own cached data to fall back on.
	if (isOffline()) return Promise.resolve(false);

	emit({ state: 'waking', startedAt: Date.now() });

	inFlight = runWake().finally(() => {
		inFlight = null;
		lastWakeEndedAt = Date.now();
	});

	return inFlight;
}

async function runWake(): Promise<boolean> {
	// First, and without waiting: hit each service's own public URL so all four
	// containers start booting at the same moment. Left to the gateway alone,
	// the gateway's cold start has to complete before it can begin waking the
	// services behind it, which stacks two boots back to back for no reason.
	// Costs nothing when the URLs aren't configured (local dev, single host).
	nudgeServicesAwake();

	for (let attempt = 1; attempt <= WAKE_ATTEMPTS; attempt++) {
		try {
			const result = await wakeServices();
			emit({ progress: result });

			if (result.ready) {
				noteServiceActivity();
				return true;
			}

			// Some answered, some did not. The gateway only replies once its
			// full budget — longer than any cold boot — has run out, so a
			// service still down now is broken, not booting, and waking again
			// cannot fix it. Release the app: everything backed by the healthy
			// services works, and the pages that need the broken one fail on
			// their own requests instead of holding every page hostage.
			if (result.services.some((service) => service.state === 'awake')) {
				noteServiceActivity();
				return false;
			}
		} catch {
			// The gateway itself is still booting, or the wake outran its own
			// timeout. Either way the request has done its job — it started
			// something — so the next attempt has a better chance.
		}

		if (isOffline()) break;
	}

	emit({ state: 'failed', startedAt: null });
	return false;
}

/**
 * Report a failure that looks like a sleeping instance, and start a wake if one
 * isn't already running, so the query's retry lands on a booting instance.
 * Ignored within `REWAKE_COOLDOWN_MS` of the last
 * wake, which has already said what is up and what is broken.
 */
export function markPossiblyCold(): void {
	if (Date.now() - lastWakeEndedAt < REWAKE_COOLDOWN_MS) return;
	lastSuccessAt = 0;
	void warmUpServices().catch(() => undefined);
}

/** Test seam. */
export function resetServiceWarmupForTests(): void {
	snapshot = { state: 'unknown', progress: null, startedAt: null };
	listeners = new Set();
	inFlight = null;
	lastSuccessAt = 0;
	lastWakeEndedAt = 0;
}
