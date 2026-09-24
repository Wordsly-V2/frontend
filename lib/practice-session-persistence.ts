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

/**
 * - `sync`      the server recorded the answers live
 * - `queued`    the answers are in this account's durable outbox, to be sent
 *               once the identity is verified online
 * - `not-saved` the answers could not be kept anywhere (no signed-in account to
 *               scope a queue record by, or device storage refused the write).
 *               Must never be reported to the learner as saved.
 */
export type SaveSessionOutcome = "sync" | "queued" | "not-saved";

export interface SaveSessionResult {
    outcome: SaveSessionOutcome;
    /**
     * Level snapshot + XP delta from a LIVE sync only. Undefined when the save
     * was queued (offline) — celebrations must never fire from a queued replay.
     */
    levelEvent?: ILevelEvent;
    /** Streak-bonus multiplier from a live sync (1 = no bonus). */
    xpMultiplier?: number;
    /**
     * Words the SERVER counted toward the daily goal, per calendar date, from a
     * live sync only. Undefined when queued — the caller then falls back to the
     * session's own count, which is right for a first pass through a set of
     * words and is the best a disconnected client can know.
     */
    countedWordsByDate?: Record<string, number>;
}

/** Minutes to add to a UTC instant to get local wall-clock time. */
function localTzOffsetMinutes(): number {
    return -new Date().getTimezoneOffset();
}

/**
 * The bulk-save body for a finished session.
 *
 * Built once, by the caller, so every path that ends up sending or queueing this
 * session — the live POST, the fallback queue, a last-ditch retry — carries the
 * same `clientRequestId`, `clientDate` and `tzOffsetMinutes`. A fresh id on a
 * second path is exactly how a lost response turns into a double XP award.
 */
export function buildSessionSaveBody(
    payload: SessionCompletePayload,
): IBulkRecordAnswersDto {
    return {
        answers: payload.wordResults,
        // The client's today, for the report's accuracy trend and streak decay.
        clientDate: localDateString(),
        // Lets the server place each answer on the right calendar day when a
        // queued batch spans more than one.
        tzOffsetMinutes: localTzOffsetMinutes(),
        // Generated BEFORE the first attempt and reused if this ends up
        // queued. That is what makes a request which reached the server but
        // whose response was lost safe to retry: previously the retry landed
        // as a second FSRS update and a second XP award.
        clientRequestId: newClientRequestId(),
    };
}

/**
 * Put a session's answers in the durable outbox. Returns false when there is no
 * account to scope the record by or storage refused it — the caller must then
 * say "not saved", never "saved on your device".
 */
export async function queueSessionSave(
    body: IBulkRecordAnswersDto,
    userLoginId: string | null,
): Promise<boolean> {
    // A record is never sent under a different identity, so without one there
    // is nowhere honest to put it.
    if (!userLoginId || !body.clientRequestId) return false;
    try {
        await enqueueSyncRecord({
            userLoginId,
            clientRequestId: body.clientRequestId,
            op: { kind: "practice-answers", body },
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Save a finished session: live when allowed, otherwise via the outbox.
 *
 * Never throws — every failure resolves to an honest outcome.
 *
 * @param canSync Only true after a live identity check this session (see
 *   useAuthSession). A cached offline-grace profile must not send data off the
 *   device, so without it the answers go straight to the queue, which
 *   OfflineBootstrap flushes once the identity is verified.
 */
export async function saveSessionResults(
    body: IBulkRecordAnswersDto,
    { userLoginId, canSync }: { userLoginId: string | null; canSync: boolean },
): Promise<SaveSessionResult> {
    const queue = async (): Promise<SaveSessionResult> =>
        (await queueSessionSave(body, userLoginId))
            ? { outcome: "queued" }
            : { outcome: "not-saved" };

    if (!canSync) return queue();

    try {
        const response = await recordAnswerBulkSync(body);
        return {
            outcome: "sync",
            levelEvent: response.levelEvent,
            xpMultiplier: response.xpMultiplier,
            countedWordsByDate: response.countedWordsByDate,
        };
    } catch {
        return queue();
    }
}
