import { recordAnswerBulkSync } from "@/apis/word-progress.api";
import { localDateString } from "@/lib/daily-habit";
import {
    enqueuePendingPracticeSave,
    getPendingPracticeSaves,
    removePendingPracticeSave,
} from "@/lib/practice-pending-saves";
import type { SessionCompletePayload } from "@/types/practice/practice.type";
import type { ILevelEvent } from "@/types/word-progress/word-progress.type";

export type SaveSessionOutcome = "sync" | "queued";

export interface SaveSessionResult {
    outcome: SaveSessionOutcome;
    /**
     * Level snapshot + XP delta from a LIVE sync only. Undefined when the save
     * was queued (offline) — celebrations must never fire from a queued replay.
     */
    levelEvent?: ILevelEvent;
    /** Streak-bonus multiplier from a live sync (1 = no bonus). */
    xpMultiplier?: number;
}

export async function saveSessionResults(
    payload: SessionCompletePayload,
): Promise<SaveSessionResult> {
    // Stamp the session with the client-local date so the report's accuracy
    // trend buckets it correctly even if the save is queued and retried later.
    const body = {
        answers: payload.wordResults,
        clientDate: localDateString(),
    };
    try {
        const response = await recordAnswerBulkSync(body);
        return {
            outcome: "sync",
            levelEvent: response.levelEvent,
            xpMultiplier: response.xpMultiplier,
        };
    } catch {
        enqueuePendingPracticeSave(body);
        return { outcome: "queued" };
    }
}

/**
 * Replay queued saves that failed to sync live. Deliberately DISCARDS the
 * response (level events / multipliers) — a celebration must only ever surface
 * from the original live save, never from a background replay of an old batch.
 */
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
