import { queryKeys } from "@/lib/query-keys";
import type { IWordProgressResponse } from "@/types/word-progress/word-progress.type";
import type { QueryClient } from "@tanstack/react-query";

export type ProgressMap = Record<string, IWordProgressResponse | null>;
export type ProgressSource = "server" | "cache" | "none";

/**
 * Recover word progress from any cached `by-word-ids` query, regardless of which
 * id set it was fetched under.
 *
 * `queryKeys.wordProgress.byWordIds` sorts and embeds the whole id list, so the
 * course page (which caches progress for every word in the course) and the
 * practice page (which asks for just this session's words) end up on completely
 * different keys. Offline, the practice page would therefore miss even though
 * the data is sitting in the cache. Scanning by wordId is what bridges them.
 *
 * This matters beyond convenience: `buildPracticeSessionPlan` tolerates missing
 * progress by treating a word as new, which would give a due review word three
 * interleaved intro rounds and the wrong hint policy.
 */
export function pickCachedProgress(
    queryClient: QueryClient,
    wordIds: string[],
): ProgressMap {
    if (wordIds.length === 0) return {};

    const wanted = new Set(wordIds);
    const merged: ProgressMap = {};
    const seenAt: Record<string, number> = {};

    const entries = queryClient.getQueriesData<ProgressMap>({
        queryKey: queryKeys.wordProgress.all,
    });

    for (const [key, data] of entries) {
        // Only the by-word-ids shape holds a wordId -> progress map.
        if (key[1] !== "by-word-ids" || !data) continue;

        const updatedAt =
            queryClient.getQueryState(key)?.dataUpdatedAt ?? 0;

        for (const [wordId, progress] of Object.entries(data)) {
            if (!wanted.has(wordId)) continue;
            // Later fetches win, so a fresh session's progress beats a stale
            // whole-course snapshot.
            if (seenAt[wordId] !== undefined && seenAt[wordId] >= updatedAt) {
                continue;
            }
            merged[wordId] = progress;
            seenAt[wordId] = updatedAt;
        }
    }

    return merged;
}

export interface ResolvedProgress {
    progressByWordId: ProgressMap | undefined;
    source: ProgressSource;
}

/**
 * Server progress when we have it, cached progress when we don't.
 *
 * Never blocks: a missing map downgrades the session (words look new) rather
 * than preventing it, but the cache scan means that rarely happens offline.
 */
export function resolveProgress(
    queryClient: QueryClient,
    wordIds: string[],
    serverData: ProgressMap | undefined,
): ResolvedProgress {
    if (serverData) {
        return { progressByWordId: serverData, source: "server" };
    }

    const cached = pickCachedProgress(queryClient, wordIds);
    if (Object.keys(cached).length > 0) {
        return { progressByWordId: cached, source: "cache" };
    }

    return { progressByWordId: undefined, source: "none" };
}
