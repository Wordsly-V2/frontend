import {
	ACCESS_TOKEN_STORAGE_KEY,
	getLocalStorageItem,
	removeLocalStorageItem,
	setLocalStorageItem,
} from '@/lib/local-storage';
import type { IUserProfile } from '@/types/users/users.type';

/**
 * The last identity the server confirmed, cached so the app can open offline.
 *
 * Nothing here grants access on its own: it records *that* the server said yes
 * and *when*, so an offline launch can be allowed for a bounded window instead
 * of bouncing the learner to a login page they cannot reach.
 */

export const AUTH_SESSION_STORAGE_KEY = 'wordsly.authSession.v2';

/**
 * The superseded v1 key.
 *
 * v1 stored the profile row's `id` under the name `userLoginId`, which is a
 * different UUID from the token's subject — so the identity check below always
 * failed and offline grace was never granted. The key is still read once, to
 * recover the id device-local records were scoped by before the fix, and is
 * wiped on logout so a previous account's blob cannot linger.
 */
export const LEGACY_AUTH_SESSION_STORAGE_KEY_V1 = 'wordsly.authSession.v1';

/** The (mis-named) id v1 scoped device-local data by, or null. */
export function readLegacyV1ScopeId(): string | null {
	const raw = getLocalStorageItem(LEGACY_AUTH_SESSION_STORAGE_KEY_V1);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as { userLoginId?: string };
		return parsed?.userLoginId ?? null;
	} catch {
		return null;
	}
}

export function clearLegacyV1AuthSession(): void {
	removeLocalStorageItem(LEGACY_AUTH_SESSION_STORAGE_KEY_V1);
}

/**
 * How long the app may be opened offline after the last successful check.
 * Long enough to cover a holiday without a connection, short enough that a lost
 * device stops showing a stranger the owner's learning data indefinitely.
 */
export const OFFLINE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

const SCHEMA_VERSION = 2;

export interface OfflineAuthSession {
	schemaVersion: number;
	userLoginId: string;
	profile: IUserProfile;
	lastVerifiedAt: string;
	lastVerifiedEpochMs: number;
}

export function readOfflineAuthSession(): OfflineAuthSession | null {
	const raw = getLocalStorageItem(AUTH_SESSION_STORAGE_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as OfflineAuthSession;
		if (parsed?.schemaVersion !== SCHEMA_VERSION) return null;
		if (!parsed.userLoginId || !parsed.profile) return null;
		return parsed;
	} catch {
		return null;
	}
}

/** Record a live, server-confirmed identity. Only call after a real 200. */
export function saveOfflineAuthSession(profile: IUserProfile): void {
	const now = new Date();
	const session: OfflineAuthSession = {
		schemaVersion: SCHEMA_VERSION,
		userLoginId: profile.userLoginId,
		profile,
		lastVerifiedAt: now.toISOString(),
		lastVerifiedEpochMs: now.getTime(),
	};
	setLocalStorageItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearOfflineAuthSession(): void {
	removeLocalStorageItem(AUTH_SESSION_STORAGE_KEY);
}

/**
 * The `sub`/`userLoginId` claim of the stored access token, or null.
 *
 * Decoded locally and used ONLY to compare against the cached session's id.
 * This is a fingerprint check, not authorization — we never trust the token's
 * contents to grant anything, we only use a mismatch as a reason to *refuse*
 * offline access, so a leftover cache from one account can't be opened while a
 * different account's token is present.
 */
export function readTokenSubject(): string | null {
	const token = getLocalStorageItem(ACCESS_TOKEN_STORAGE_KEY);
	if (!token) return null;

	const payload = token.split('.')[1];
	if (!payload) return null;

	try {
		const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
		const claims = JSON.parse(json) as {
			userLoginId?: string;
			sub?: string;
		};
		// `sub` is the standard claim; `userLoginId` is the legacy one kept
		// during the auth migration and dropped once no tokens carry it.
		return claims.sub ?? claims.userLoginId ?? null;
	} catch {
		return null;
	}
}

/** The id to scope device-local data by before the profile has loaded. */
export function getBootUserLoginId(): string | null {
	return readOfflineAuthSession()?.userLoginId ?? null;
}

export type OfflineGraceRejection =
	| 'no-session'
	| 'identity-mismatch'
	| 'clock-rolled-back'
	| 'expired';

export type OfflineGraceResult =
	| { allowed: true; session: OfflineAuthSession; expiresAtMs: number }
	| { allowed: false; reason: OfflineGraceRejection };

/**
 * May the app open offline right now?
 *
 * Three independent conditions must all hold, each cheap to audit:
 *   1. a cached session exists;
 *   2. its id matches the access token currently on the device;
 *   3. the elapsed time since the last live check is inside the window, and is
 *      not negative (a rolled-back clock must not buy extra grace).
 *
 * The caller is responsible for the fourth: only ever ask this after a *network*
 * failure. A 401 must never reach here.
 */
export function evaluateOfflineGrace(params: {
	nowMs?: number;
	/** Newest queued write, if any — a tamper signal when it postdates grace. */
	newestQueuedAtMs?: number;
}): OfflineGraceResult {
	const nowMs = params.nowMs ?? Date.now();
	const session = readOfflineAuthSession();
	if (!session) return { allowed: false, reason: 'no-session' };

	const tokenSubject = readTokenSubject();
	if (tokenSubject && tokenSubject !== session.userLoginId) {
		return { allowed: false, reason: 'identity-mismatch' };
	}

	const elapsed = nowMs - session.lastVerifiedEpochMs;
	if (elapsed < 0) return { allowed: false, reason: 'clock-rolled-back' };
	if (elapsed > OFFLINE_GRACE_MS) return { allowed: false, reason: 'expired' };

	// A queued write newer than the whole grace window means the device clock
	// moved; treat it as expired rather than trusting the arithmetic above.
	if (
		params.newestQueuedAtMs !== undefined &&
		params.newestQueuedAtMs > session.lastVerifiedEpochMs + OFFLINE_GRACE_MS
	) {
		return { allowed: false, reason: 'clock-rolled-back' };
	}

	return {
		allowed: true,
		session,
		expiresAtMs: session.lastVerifiedEpochMs + OFFLINE_GRACE_MS,
	};
}
