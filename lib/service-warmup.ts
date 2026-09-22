import { wakeServices, type WakeResult } from '@/apis/app.api';
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
 * The old bootstrap did fire a wake, but nothing waited for it: it raced the
 * page's own queries and they lost. So the rule here is that there is exactly
 * one wake in flight at a time, everything else *waits on that same promise*,
 * and only requests that have something to wait for are held.
 */

/**
 * Idle instances are suspended after ~15 minutes. Staying under that means a
 * learner coming back from a coffee break gets a wake rather than a failure.
 */
const COLD_AFTER_MS = 13 * 60_000;

/** Wake attempts before giving up and letting requests through unheld. */
const WAKE_ATTEMPTS = 3;

/**
 * Longest a real request will wait on a wake.
 *
 * A gate that can outlast the learner's patience is worse than the failure it
 * replaces, so past this point requests go through and take their chances — the
 * query retry policy is the next line of defence.
 */
const MAX_GATE_WAIT_MS = 75_000;

let snapshot: WarmupSnapshot = {
	state: 'unknown',
	progress: null,
	startedAt: null,
};
let listeners = new Set<() => void>();
let inFlight: Promise<boolean> | null = null;
let lastSuccessAt = 0;

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
	});

	return inFlight;
}

async function runWake(): Promise<boolean> {
	for (let attempt = 1; attempt <= WAKE_ATTEMPTS; attempt++) {
		try {
			const result = await wakeServices();
			emit({ progress: result });

			if (result.ready) {
				noteServiceActivity();
				return true;
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
 * Wait for an in-flight wake, bounded.
 *
 * Only ever waits on a wake that is *already* running — it never starts one, so
 * a request can't be held hostage by a warm-up nobody asked for.
 */
export async function whenWarm(): Promise<void> {
	if (!inFlight) return;

	await Promise.race([
		inFlight,
		new Promise((resolve) => setTimeout(resolve, MAX_GATE_WAIT_MS)),
	]).catch(() => undefined);
}

/**
 * Report a failure that looks like a sleeping instance, and start a wake if one
 * isn't already running. The request that triggered this is lost, but its retry
 * now has something to wait for.
 */
export function markPossiblyCold(): void {
	lastSuccessAt = 0;
	void warmUpServices().catch(() => undefined);
}

/** Test seam. */
export function resetServiceWarmupForTests(): void {
	snapshot = { state: 'unknown', progress: null, startedAt: null };
	listeners = new Set();
	inFlight = null;
	lastSuccessAt = 0;
}
