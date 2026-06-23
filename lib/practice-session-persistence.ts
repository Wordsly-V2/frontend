import { recordAnswerBulkSync } from "@/apis/word-progress.api";
import { localDateString } from "@/lib/daily-habit";
import {
    enqueuePendingPracticeSave,
    getPendingPracticeSaves,
    removePendingPracticeSave,
} from "@/lib/practice-pending-saves";
import type { SessionCompletePayload } from "@/types/practice/practice.type";

export type SaveSessionOutcome = "sync" | "queued";

export async function saveSessionResults(
    payload: SessionCompletePayload,
): Promise<SaveSessionOutcome> {
    // Stamp the session with the client-local date so the report's accuracy
    // trend buckets it correctly even if the save is queued and retried later.
    const body = {
        answers: payload.wordResults,
        clientDate: localDateString(),
    };
    try {
        await recordAnswerBulkSync(body);
        return "sync";
    } catch {
        enqueuePendingPracticeSave(body);
        return "queued";
    }
}

export async function flushPendingPracticeSaves(): Promise<void> {
    const pending = getPendingPracticeSaves();
    for (const item of pending) {
        try {
            await recordAnswerBulkSync(item.payload);
            removePendingPracticeSave(item.id);
        } catch {
            break;
        }
    }
}
