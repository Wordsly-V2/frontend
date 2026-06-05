import type { QueryClient } from "@tanstack/react-query";
import type {
    IBulkRecordAnswersDto,
    IWordProgressResponse,
} from "@/types/word-progress/word-progress.type";
import { AnswerQuality } from "@/types/word-progress/word-progress.type";

function isCorrectQuality(quality: AnswerQuality): boolean {
    return quality >= AnswerQuality.CORRECT_WITH_DIFFICULTY;
}

function applyAnswerToProgress(
    prev: IWordProgressResponse | null | undefined,
    wordId: string,
    quality: AnswerQuality,
): IWordProgressResponse {
    const correct = isCorrectQuality(quality);
    const now = new Date();

    if (!prev) {
        return {
            id: `optimistic-${wordId}`,
            wordId,
            userLoginId: "",
            easeFactor: 2.5,
            interval: correct ? 1 : 0,
            repetitions: correct ? 1 : 0,
            lastReviewedAt: now,
            nextReviewAt: new Date(now.getTime() + (correct ? 86_400_000 : 600_000)),
            totalReviews: 1,
            correctReviews: correct ? 1 : 0,
            successRate: correct ? 100 : 0,
        };
    }

    const totalReviews = prev.totalReviews + 1;
    const correctReviews = prev.correctReviews + (correct ? 1 : 0);
    const intervalDays = correct ? Math.max(1, prev.interval || 1) : 0;

    return {
        ...prev,
        totalReviews,
        correctReviews,
        successRate: Math.round((correctReviews / totalReviews) * 100),
        repetitions: correct ? prev.repetitions + 1 : 0,
        interval: intervalDays,
        lastReviewedAt: now,
        nextReviewAt: new Date(now.getTime() + (correct ? intervalDays * 86_400_000 : 600_000)),
    };
}

/** Patch React Query cache so stats feel instant after a session. */
export function applyOptimisticWordProgress(
    queryClient: QueryClient,
    wordIds: string[],
    before: Record<string, IWordProgressResponse | null> | undefined,
    payload: IBulkRecordAnswersDto,
): void {
    const merged = { ...(before ?? {}) };
    for (const answer of payload.answers) {
        merged[answer.wordId] = applyAnswerToProgress(
            merged[answer.wordId],
            answer.wordId,
            answer.quality,
        );
    }

    queryClient.setQueryData(
        ["word-progress", "by-word-ids", wordIds],
        merged,
    );
}
