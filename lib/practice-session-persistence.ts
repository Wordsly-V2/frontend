import { recordAnswerBulkSync } from "@/apis/word-progress.api";
import { localDateString } from "@/lib/daily-habit";
import {
    enqueueSyncRecord,
    newClientRequestId,
} from "@/lib/offline/sync-queue";
import type { SessionCompletePayload } from "@/types/practice/practice.type";
import type {
    IBulkRecordAnswersDto,
    ILevelEvent,
} from "@/types/word-progress/word-progress.type";

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

/** Minutes to add to a UTC instant to get local wall-clock time. */
function localTzOffsetMinutes(): number {
    return -new Date().getTimezoneOffset();
}

export async function saveSessionResults(
    payload: SessionCompletePayload,
    userLoginId: string | null,
): Promise<SaveSessionResult> {
    // Generated BEFORE the first attempt and reused if this ends up queued. That
    // is what makes a request which reached the server but whose response was
    // lost safe to retry: previously the retry landed as a second FSRS update
    // and a second XP award.
    const clientRequestId = newClientRequestId();

    const body: IBulkRecordAnswersDto = {
        answers: payload.wordResults,
        // The client's today, for the report's accuracy trend and streak decay.
        clientDate: localDateString(),
        // Lets the server place each answer on the right calendar day when a
        // queued batch spans more than one.
        tzOffsetMinutes: localTzOffsetMinutes(),
        clientRequestId,
    };

    try {
        const response = await recordAnswerBulkSync(body);
        return {
            outcome: "sync",
            levelEvent: response.levelEvent,
            xpMultiplier: response.xpMultiplier,
        };
    } catch {
        if (userLoginId) {
            await enqueueSyncRecord({
                userLoginId,
                clientRequestId,
                op: { kind: "practice-answers", body },
            });
        }
        return { outcome: "queued" };
    }
}
