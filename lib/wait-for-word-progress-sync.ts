import { getProgressByWordIds } from "@/apis/word-progress.api";
import type { IWordProgressResponse } from "@/types/word-progress/word-progress.type";

export interface WaitForProgressSyncOptions {
    /** Max poll attempts (default 12). */
    maxAttempts?: number;
    /** Delay between polls in ms (default 400). */
    intervalMs?: number;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True when Kafka consumer has persisted at least one new review for this word. */
function isWordProgressUpdated(
    wordId: string,
    before: Record<string, IWordProgressResponse | null> | undefined,
    after: Record<string, IWordProgressResponse | null>,
): boolean {
    const prev = before?.[wordId] ?? null;
    const next = after[wordId] ?? null;
    if (!next) return false;
    if (!prev) return next.totalReviews >= 1;
    return next.totalReviews > prev.totalReviews;
}

/**
 * Poll learning-service until bulk Kafka writes appear in read APIs.
 * recordAnswerBulk only queues messages — reads stay stale until the consumer finishes.
 */
export async function waitForWordProgressSync(
    wordIds: string[],
    beforeProgress: Record<string, IWordProgressResponse | null> | undefined,
    options: WaitForProgressSyncOptions = {},
): Promise<boolean> {
    if (wordIds.length === 0) return true;

    const maxAttempts = options.maxAttempts ?? 12;
    const intervalMs = options.intervalMs ?? 400;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const current = await getProgressByWordIds(wordIds);
            const allSynced = wordIds.every((id) =>
                isWordProgressUpdated(id, beforeProgress, current),
            );
            if (allSynced) return true;
        } catch {
            // Transient read errors — retry until timeout
        }
        if (attempt < maxAttempts - 1) {
            await sleep(intervalMs);
        }
    }

    return false;
}
