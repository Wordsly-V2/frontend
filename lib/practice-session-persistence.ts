import {
    recordAnswerBulk,
    recordAnswerBulkSync,
} from "@/apis/word-progress.api";
import {
    enqueuePendingPracticeSave,
    getPendingPracticeSaves,
    removePendingPracticeSave,
} from "@/lib/practice-pending-saves";
import type { SessionCompletePayload } from "@/types/practice/practice.type";

export type SaveSessionOutcome = "sync" | "async" | "queued";

export async function saveSessionResults(
    payload: SessionCompletePayload,
): Promise<SaveSessionOutcome> {
    try {
        await recordAnswerBulkSync({ answers: payload.wordResults });
        return "sync";
    } catch {
        try {
            await recordAnswerBulk({ answers: payload.wordResults });
            return "async";
        } catch {
            enqueuePendingPracticeSave({ answers: payload.wordResults });
            return "queued";
        }
    }
}

export async function flushPendingPracticeSaves(): Promise<void> {
    const pending = getPendingPracticeSaves();
    for (const item of pending) {
        try {
            await recordAnswerBulkSync(item.payload);
            removePendingPracticeSave(item.id);
        } catch {
            try {
                await recordAnswerBulk(item.payload);
                removePendingPracticeSave(item.id);
            } catch {
                break;
            }
        }
    }
}
