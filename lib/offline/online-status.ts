import { pingApiGateway } from '@/apis/app.api';

export type OnlineStatus = 'online' | 'offline' | 'checking';

/**
 * Single source of truth for connectivity.
 *
 * `navigator.onLine` only tells the truth when it says *offline* — it reports
 * "online" on a captive portal or a dead uplink. And because the API lives on a
 * different origin, being able to load the Next app proves nothing about the
 * gateway. So the real signal is the API path itself: any axios failure with no
 * HTTP response marks us offline immediately, and a probe decides when we are
 * back. While healthy, the existing 5-minute ServiceHealthMonitor feeds this
 * store, so there is no second poller running in the background.
 */

const PROBE_MIN_DELAY_MS = 15_000;
const PROBE_MAX_DELAY_MS = 5 * 60_000;

let status: OnlineStatus = 'online';
let listeners = new Set<() => void>();
let probeTimer: ReturnType<typeof setTimeout> | null = null;
let probeDelay = PROBE_MIN_DELAY_MS;
let started = false;

function emit(): void {
	for (const listener of listeners) listener();
}

function setStatus(next: OnlineStatus): void {
	if (status === next) return;
	status = next;
	emit();

	if (next === 'offline') {
		probeDelay = PROBE_MIN_DELAY_MS;
		scheduleProbe();
	} else if (next === 'online') {
		cancelProbe();
	}
}

function cancelProbe(): void {
	if (probeTimer) {
		clearTimeout(probeTimer);
		probeTimer = null;
	}
}

function scheduleProbe(): void {
	cancelProbe();
	probeTimer = setTimeout(() => {
		void runProbe();
	}, probeDelay);
}

async function runProbe(): Promise<void> {
	if (status === 'online') return;

	const backOff = (): void => {
		probeDelay = Math.min(probeDelay * 2, PROBE_MAX_DELAY_MS);
		// Assign directly rather than via setStatus so a failed probe from the
		// 'checking' state doesn't reset the backoff it just grew.
		if (status !== 'offline') {
			status = 'offline';
			emit();
		}
		scheduleProbe();
	};

	// The browser is certain we have no link — no point spending a request.
	if (typeof navigator !== 'undefined' && navigator.onLine === false) {
		backOff();
		return;
	}

	try {
		await pingApiGateway();
		setStatus('online');
	} catch {
		backOff();
	}
}

/** Report a request that never reached the server. */
export function reportNetworkFailure(): void {
	setStatus('offline');
}

/** Report any successful call to the API — the strongest "we're online" signal. */
export function reportNetworkSuccess(): void {
	setStatus('online');
}

export function getOnlineStatus(): OnlineStatus {
	return status;
}

export function isOffline(): boolean {
	return status === 'offline';
}

export function subscribeToOnlineStatus(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/** Wire browser connectivity events. Safe to call more than once. */
export function startOnlineStatusTracking(): void {
	if (started || typeof window === 'undefined') return;
	started = true;

	if (navigator.onLine === false) {
		status = 'offline';
		scheduleProbe();
	}

	window.addEventListener('offline', () => setStatus('offline'));
	// "online" only means the OS has a link, not that the API is reachable, so
	// verify before declaring recovery.
	window.addEventListener('online', () => {
		setStatus('checking');
		void runProbe();
	});
}

/** Force an immediate reachability check (e.g. from a Retry button). */
export async function recheckOnlineStatus(): Promise<OnlineStatus> {
	if (status === 'online') return status;
	setStatus('checking');
	await runProbe();
	return status;
}

/** Test seam. */
export function resetOnlineStatusForTests(): void {
	status = 'online';
	listeners = new Set();
	cancelProbe();
	probeDelay = PROBE_MIN_DELAY_MS;
	started = false;
}
