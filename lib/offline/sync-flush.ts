import { recordDailyPracticeBatch } from "@/apis/daily-habit.api";
import { recordAnswerBulkSync } from "@/apis/word-progress.api";
import { saveWord, unsaveWord } from "@/apis/saved-words.api";
import { toApiError } from "@/lib/api-error";
import {
	backoffMs,
	deleteSyncRecord,
	getSyncRecordsForUser,
	updateSyncRecord,
	type SyncRecord,
} from "./sync-queue";

/**
 * Send queued offline writes.
 *
 * Two rules keep this safe:
 *
 * 1. It only runs when the server has confirmed the identity in *this* session.
 *    A cached profile is enough to read local data, never enough to send it.
 * 2. Every record carries a stable `clientRequestId`, so a resend after a lost
 *    response is a no-op server-side rather than a second XP award.
 */

export type FlushReason =
	| "mount"
	| "online"
	| "visible"
	| "sw-message"
	| "verified"
	| "interval"
	| "manual";

let isFlushing = false;

/**
 * How long a record may sit in `in-flight` before it is considered abandoned.
 *
 * A record is marked in-flight before the request goes out, so a tab closed or
 * crashed mid-request leaves one behind that no later flush would ever pick up
 * again — `flushOnce` only selects `pending`. That silently lost the learner's
 * practice. Re-sending is safe: the `clientRequestId` is minted before the first
 * attempt, so the server's ledger turns a duplicate into a no-op.
 *
 * Deliberately generous. There is no client-side request timeout, so a genuinely
 * slow upload on a bad connection must not be reclaimed out from under itself;
 * the cost of waiting too long is a delayed sync, the cost of reclaiming too
 * early is a redundant request.
 */
const STALE_IN_FLIGHT_MS = 120_000;

/** Statuses that mean "the server might still succeed if we try again". */
function isRetryableStatus(status: number | undefined): boolean {
	if (status === undefined) return true; // network failure
	if (status === 408 || status === 429) return true;
	// 409 is the ledger telling us the original request is still in flight.
	if (status === 409) return true;
	return status >= 500;
}

async function sendRecord(record: SyncRecord): Promise<void> {
	if (record.op.kind === "practice-answers") {
		await recordAnswerBulkSync({
			...record.op.body,
			clientRequestId: record.clientRequestId,
		});
		return;
	}

	if (record.op.kind === "saved-word") {
		const { wordId, note, saved } = record.op.body;
		// A queued flag whose word was deleted meanwhile 404s, which is not
		// retryable and lands in failed-permanent for the learner to discard —
		// the same path every other permanently-rejected record takes.
		if (saved) {
			await saveWord({ wordId, note });
		} else {
			await unsaveWord(wordId);
		}
		return;
	}

	await recordDailyPracticeBatch(record.op.body);
}

async function flushRecord(record: SyncRecord): Promise<"sent" | "retry" | "failed"> {
	await updateSyncRecord({
		...record,
		status: "in-flight",
		lastAttemptAt: new Date().toISOString(),
	});

	try {
		await sendRecord(record);
		await deleteSyncRecord(record.id);
		return "sent";
	} catch (error) {
		const apiError = toApiError(error);
		const attempts = record.attempts + 1;

		if (isRetryableStatus(apiError.status)) {
			await updateSyncRecord({
				...record,
				status: "pending",
				attempts,
				lastError: apiError.message,
				nextAttemptAt: new Date(
					Date.now() + backoffMs(attempts),
				).toISOString(),
			});
			return "retry";
		}

		// A 4xx the server will keep rejecting. Surfaced in the UI with retry and
		// discard options rather than dropped, so the learner decides.
		await updateSyncRecord({
			...record,
			status: "failed-permanent",
			attempts,
			lastError: apiError.message,
		});
		return "failed";
	}
}

export interface FlushResult {
	sent: number;
	remaining: number;
	skipped: boolean;
}

/**
 * @param canSync Must be true only when the server confirmed the identity live
 * this session (see useAuthSession). This is the gate that keeps offline grace
 * from ever putting data on the wire.
 */
export async function flushSyncQueue(params: {
	userLoginId: string | null;
	canSync: boolean;
	reason: FlushReason;
}): Promise<FlushResult> {
	const { userLoginId, canSync } = params;

	if (!userLoginId || !canSync || isFlushing) {
		return { sent: 0, remaining: 0, skipped: true };
	}

	isFlushing = true;
	try {
		return await withCrossTabLock(() => flushOnce(userLoginId));
	} finally {
		isFlushing = false;
	}
}

async function flushOnce(userLoginId: string): Promise<FlushResult> {
	const now = Date.now();
	await reclaimStaleInFlight(userLoginId, now);

	const records = await getSyncRecordsForUser(userLoginId);

	const due = records.filter(
		(record) =>
			record.status === "pending" &&
			new Date(record.nextAttemptAt).getTime() <= now,
	);

	let sent = 0;
	for (const record of due) {
		const outcome = await flushRecord(record);
		if (outcome === "sent") {
			sent += 1;
			continue;
		}
		// Stop on the first retryable failure: the network is evidently still
		// bad, and hammering it just burns battery and backs off every record.
		if (outcome === "retry") break;
	}

	const after = await getSyncRecordsForUser(userLoginId);
	return {
		sent,
		remaining: after.filter((record) => record.status === "pending").length,
		skipped: false,
	};
}

/**
 * Return abandoned in-flight records to the queue.
 *
 * Runs inside the cross-tab lock, so a record another tab is actively sending
 * cannot be reclaimed mid-request.
 */
async function reclaimStaleInFlight(
	userLoginId: string,
	now: number,
): Promise<void> {
	const records = await getSyncRecordsForUser(userLoginId);

	for (const record of records) {
		if (record.status !== "in-flight") continue;

		const startedAt = new Date(
			record.lastAttemptAt ?? record.createdAt,
		).getTime();
		// A missing or unparseable timestamp would otherwise strand the record
		// forever, which is the exact bug this guards against.
		if (Number.isFinite(startedAt) && now - startedAt < STALE_IN_FLIGHT_MS) {
			continue;
		}

		await updateSyncRecord({
			...record,
			status: "pending",
			nextAttemptAt: new Date(now).toISOString(),
		});
	}
}

/** Serialize flushes across tabs, where the browser supports it. */
async function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
	if (typeof navigator === "undefined" || !navigator.locks) {
		return fn();
	}
	return navigator.locks.request("wordsly-sync", fn) as Promise<T>;
}
