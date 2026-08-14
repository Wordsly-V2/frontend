import { recordDailyPracticeBatch } from "@/apis/daily-habit.api";
import { recordAnswerBulkSync } from "@/apis/word-progress.api";
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
	const records = await getSyncRecordsForUser(userLoginId);
	const now = Date.now();

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

/** Serialize flushes across tabs, where the browser supports it. */
async function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
	if (typeof navigator === "undefined" || !navigator.locks) {
		return fn();
	}
	return navigator.locks.request("wordsly-sync", fn) as Promise<T>;
}
