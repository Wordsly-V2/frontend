import { DEFAULT_NEW_WORDS_LIMIT } from "@/lib/due-words-limit";
import { getWordLearningStage } from "@/lib/word-progress-stage";
import type { IDueWordIdsResponse } from "@/types/word-progress/word-progress.type";
import type { ProgressMap } from "./progress-cache";

/**
 * Choose which words to practise using only locally cached data.
 *
 * The server's due-words endpoint is a POST, so there is nothing to fall back on
 * offline. This reproduces its selection from the cached progress records,
 * reusing `getWordLearningStage` rather than reimplementing the scheduling
 * rules — the one thing that must not drift between the two.
 */

export interface OfflineDueWordSelection extends IDueWordIdsResponse {
    /** Marks the result as locally derived, never server truth. */
    source: "offline";
}

export interface SelectDueWordIdsOfflineParams {
    wordIds: string[];
    progressByWordId: ProgressMap | undefined;
    limit?: number;
    newLimit?: number;
    includeNew?: boolean;
    now?: Date;
}

export function selectDueWordIdsOffline({
    wordIds,
    progressByWordId,
    limit = 20,
    newLimit,
    includeNew = true,
    now = new Date(),
}: SelectDueWordIdsOfflineParams): OfflineDueWordSelection {
    const due: { wordId: string; dueAt: number }[] = [];
    const fresh: string[] = [];

    for (const wordId of wordIds) {
        const progress = progressByWordId?.[wordId] ?? null;

        // A suspended leech is deliberately out of rotation; an offline session
        // must not quietly resurrect it.
        if (progress?.suspendedAt) continue;

        const stage = getWordLearningStage(progress, now);
        if (stage === "due") {
            due.push({
                wordId,
                dueAt: progress
                    ? new Date(progress.nextReviewAt).getTime()
                    : 0,
            });
        } else if (stage === "new") {
            fresh.push(wordId);
        }
    }

    // Most overdue first — the same ordering the practice queue uses.
    due.sort((a, b) => a.dueAt - b.dueAt);

    const selectedDue = due.slice(0, limit).map((entry) => entry.wordId);
    // `fresh` keeps the caller's word order, which is how the server picks new
    // words too — so repeated offline builds are deterministic.
    const selectedNew = includeNew
        ? fresh.slice(0, newLimit ?? DEFAULT_NEW_WORDS_LIMIT)
        : [];

    return {
        wordIds: [...selectedDue, ...selectedNew],
        // Deliberately absent. Daily pacing is server state and there is no
        // honest local approximation — `getPacingBannerCopy` returns null for
        // undefined pacing, so no limit banner is invented offline.
        pacing: undefined,
        source: "offline",
    };
}
