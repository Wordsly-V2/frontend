import { toApiError } from '@/lib/api-error';

/**
 * Telling "the server is still booting" apart from "the server said no".
 *
 * On a platform that suspends idle instances (Render's free tier), the first
 * request after a quiet spell arrives at a container that does not exist yet.
 * The edge answers 502/503 while it boots, or the gateway's own proxy answers
 * 504 because the downstream service took longer than the proxy timeout. All of
 * these are *transient by construction* — the very request that failed is what
 * started the boot, so the retry a few seconds later usually succeeds.
 *
 * Deliberately limited to responses that carry an HTTP status. A failure with no
 * response at all is the offline signal (`lib/offline/online-status.ts`) and
 * must stay that way: treating it as a cold start would make a learner with no
 * connection sit through a retry storm instead of dropping straight to their
 * cached data.
 */
const COLD_START_STATUSES = new Set([
	// Request Timeout — some edges use this for a boot that outran their budget.
	408,
	// Bad Gateway / Service Unavailable — the platform edge while booting, and
	// the gateway's own proxy when it cannot reach a sleeping service.
	502,
	503,
	// Gateway Timeout — the service accepted the connection and was still
	// starting up when the proxy timeout expired.
	504,
]);

/** True when a failure looks like a sleeping instance rather than a refusal. */
export function isColdStartError(error: unknown): boolean {
	const status = toApiError(error).status;
	return status !== undefined && COLD_START_STATUSES.has(status);
}
