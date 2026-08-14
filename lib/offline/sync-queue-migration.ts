import { getLocalStorageItem, removeLocalStorageItem } from "@/lib/local-storage";
import { PENDING_SAVES_KEY } from "@/lib/practice-pending-saves";
import type { IBulkRecordAnswersDto } from "@/types/word-progress/word-progress.type";
import { enqueueSyncRecord, newClientRequestId } from "./sync-queue";

interface LegacyPendingSave {
	id: string;
	savedAt: string;
	payload: IBulkRecordAnswersDto;
}

/**
 * Move anything left in the old localStorage outbox into IndexedDB.
 *
 * A learner upgrading mid-session may have unsynced answers sitting in the old
 * store; dropping them would silently lose real practice. The record's
 * `savedAt` becomes each answer's `reviewedAt` — not exact, but far closer to
 * the truth than the sync time, which is what the old format implied.
 */
export async function migrateLegacyPendingSaves(
	userLoginId: string,
): Promise<number> {
	const raw = getLocalStorageItem(PENDING_SAVES_KEY);
	if (!raw) return 0;

	let legacy: LegacyPendingSave[] = [];
	try {
		const parsed = JSON.parse(raw) as LegacyPendingSave[];
		legacy = Array.isArray(parsed) ? parsed : [];
	} catch {
		removeLocalStorageItem(PENDING_SAVES_KEY);
		return 0;
	}

	for (const item of legacy) {
		await enqueueSyncRecord({
			userLoginId,
			// The old format had no idempotency key, so one is minted here. The
			// localStorage key is removed below, so this runs at most once.
			clientRequestId: newClientRequestId(),
			op: {
				kind: "practice-answers",
				body: {
					...item.payload,
					answers: item.payload.answers.map((answer) => ({
						...answer,
						reviewedAt: answer.reviewedAt ?? item.savedAt,
					})),
				},
			},
		});
	}

	removeLocalStorageItem(PENDING_SAVES_KEY);
	return legacy.length;
}
