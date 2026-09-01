import type { IBulkRecordAnswersDto } from "@/types/word-progress/word-progress.type";
import {
	getOfflineDb,
	isIdbAvailable,
	STORE_SYNC_QUEUE,
} from "./idb";

/**
 * Durable outbox for writes made while offline.
 *
 * Replaces the old localStorage list, which had three problems: it was flushed
 * only on mount (never on reconnect), it had no idempotency key so a retry after
 * a lost response double-applied XP, and it had no per-answer timestamps so a
 * multi-day queue collapsed onto the sync date.
 *
 * Records are never silently dropped. A permanently failing record is surfaced
 * for the learner to retry or explicitly discard, and a record belonging to a
 * signed-out account is quarantined rather than deleted.
 */

export const SYNC_SCHEMA_VERSION = 1;

export type SyncRecordStatus =
	| "pending"
	| "in-flight"
	| "failed-permanent"
	| "quarantined";

export interface PracticeAnswersOp {
	kind: "practice-answers";
	body: IBulkRecordAnswersDto;
}

export interface DailyHabitOp {
	kind: "daily-habit";
	body: {
		days: { clientDate: string; wordCount: number }[];
		clientDate: string;
		clientRequestId: string;
	};
}

export type SyncOp = PracticeAnswersOp | DailyHabitOp;

export interface SyncRecord {
	id: string;
	schemaVersion: number;
	/** Scope. A record is never sent under a different identity. */
	userLoginId: string;
	/** Idempotency key — generated once, reused on every attempt. */
	clientRequestId: string;
	op: SyncOp;
	createdAt: string;
	status: SyncRecordStatus;
	attempts: number;
	lastAttemptAt?: string;
	nextAttemptAt: string;
	lastError?: string;
}

const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 30 * 60_000;

let listeners = new Set<() => void>();

function emit(): void {
	for (const listener of listeners) listener();
}

export function subscribeToSyncQueue(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function newClientRequestId(): string {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	// Only reached on very old browsers; uniqueness is what matters, not format.
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Delay before the next attempt, with jitter so retries don't synchronize. */
export function backoffMs(attempts: number): number {
	const base = Math.min(BASE_BACKOFF_MS * 2 ** attempts, MAX_BACKOFF_MS);
	const jitter = base * 0.2 * (Math.random() * 2 - 1);
	return Math.round(base + jitter);
}

export async function enqueueSyncRecord(params: {
	userLoginId: string;
	clientRequestId: string;
	op: SyncOp;
}): Promise<SyncRecord> {
	const now = new Date().toISOString();
	const record: SyncRecord = {
		id: newClientRequestId(),
		schemaVersion: SYNC_SCHEMA_VERSION,
		userLoginId: params.userLoginId,
		clientRequestId: params.clientRequestId,
		op: params.op,
		createdAt: now,
		status: "pending",
		attempts: 0,
		nextAttemptAt: now,
	};

	const db = await getOfflineDb();
	await db.put(STORE_SYNC_QUEUE, record);
	emit();
	return record;
}

export async function getAllSyncRecords(): Promise<SyncRecord[]> {
	if (!isIdbAvailable()) return [];
	const db = await getOfflineDb();
	const records = (await db.getAll(STORE_SYNC_QUEUE)) as SyncRecord[];
	return records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getSyncRecordsForUser(
	userLoginId: string,
): Promise<SyncRecord[]> {
	const all = await getAllSyncRecords();
	return all.filter((record) => record.userLoginId === userLoginId);
}

export async function updateSyncRecord(record: SyncRecord): Promise<void> {
	const db = await getOfflineDb();
	await db.put(STORE_SYNC_QUEUE, record);
	emit();
}

export async function deleteSyncRecord(id: string): Promise<void> {
	const db = await getOfflineDb();
	await db.delete(STORE_SYNC_QUEUE, id);
	emit();
}

/**
 * Park every record for a user instead of deleting it.
 *
 * Used when the server rejects the session or a different account signs in. The
 * refresh flow can fail for entirely legitimate reasons (an expired session
 * after days offline), and destroying a week of practice because of that would
 * be the worst possible outcome. If the same account signs back in, the records
 * are offered again.
 */
export async function quarantineSyncQueue(userLoginId?: string): Promise<void> {
	if (!isIdbAvailable()) return;
	const records = await getAllSyncRecords();

	for (const record of records) {
		if (userLoginId && record.userLoginId !== userLoginId) continue;
		if (record.status === "quarantined") continue;
		await updateSyncRecord({ ...record, status: "quarantined" });
	}
}

/** Bring a user's quarantined records back into play after they sign in again. */
export async function releaseQuarantinedRecords(
	userLoginId: string,
): Promise<number> {
	const records = await getSyncRecordsForUser(userLoginId);
	const quarantined = records.filter(
		(record) => record.status === "quarantined",
	);

	const now = new Date().toISOString();
	for (const record of quarantined) {
		await updateSyncRecord({
			...record,
			status: "pending",
			attempts: 0,
			nextAttemptAt: now,
		});
	}
	return quarantined.length;
}

/**
 * Fold a day's words into an existing queued habit record.
 *
 * Without this, fifteen offline sessions across four days would produce fifteen
 * records and fifteen requests; merged they become one request with four day
 * buckets, which is also what keeps the streak recomputation cheap.
 */
export async function mergeDailyHabitRecord(params: {
	userLoginId: string;
	clientDate: string;
	wordCount: number;
}): Promise<void> {
	const records = await getSyncRecordsForUser(params.userLoginId);
	const existing = records.find(
		(record) =>
			record.op.kind === "daily-habit" &&
			(record.status === "pending" || record.status === "quarantined"),
	);

	if (!existing || existing.op.kind !== "daily-habit") {
		await enqueueSyncRecord({
			userLoginId: params.userLoginId,
			clientRequestId: newClientRequestId(),
			op: {
				kind: "daily-habit",
				body: {
					days: [
						{
							clientDate: params.clientDate,
							wordCount: params.wordCount,
						},
					],
					clientDate: params.clientDate,
					clientRequestId: newClientRequestId(),
				},
			},
		});
		return;
	}

	const days = [...existing.op.body.days];
	const bucket = days.find((day) => day.clientDate === params.clientDate);
	if (bucket) {
		bucket.wordCount += params.wordCount;
	} else {
		days.push({
			clientDate: params.clientDate,
			wordCount: params.wordCount,
		});
	}

	await updateSyncRecord({
		...existing,
		op: {
			kind: "daily-habit",
			body: {
				...existing.op.body,
				days,
				// The batch changed, so it is a different request: a new id keeps
				// the server from replaying the older, smaller version.
				clientRequestId: newClientRequestId(),
				clientDate: params.clientDate,
			},
		},
		// Editing a merged batch resets its backoff so the new words go out soon.
		status: "pending",
		attempts: 0,
		nextAttemptAt: new Date().toISOString(),
	});
}

/**
 * Move every record from one scope id to another.
 *
 * Queued work is partitioned by the id the app believed identified the account.
 * When that id is corrected, records left under the old one become invisible to
 * the flusher and the learner silently loses practice they already did — so the
 * correction has to carry them across rather than orphan them.
 */
export async function rescopeSyncRecords(
	fromUserLoginId: string,
	toUserLoginId: string,
): Promise<number> {
	if (!isIdbAvailable()) return 0;
	if (fromUserLoginId === toUserLoginId) return 0;

	const stale = await getSyncRecordsForUser(fromUserLoginId);
	for (const record of stale) {
		await updateSyncRecord({ ...record, userLoginId: toUserLoginId });
	}
	return stale.length;
}

/** Newest queued write, used as a clock-tampering signal by the auth grace check. */
export async function newestQueuedAtMs(): Promise<number | undefined> {
	const records = await getAllSyncRecords();
	if (records.length === 0) return undefined;
	return Math.max(
		...records.map((record) => new Date(record.createdAt).getTime()),
	);
}

/** Test seam. */
export function resetSyncQueueListenersForTests(): void {
	listeners = new Set();
}
