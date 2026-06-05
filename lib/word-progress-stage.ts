import type { IWordProgressResponse } from "@/types/word-progress/word-progress.type";
import type { IWord } from "@/types/courses/courses.type";
import type { PracticeSessionKind } from "@/lib/practice-session";
import { shuffleArray } from "@/lib/practice-utils";

/** Matches backend stats in learning-service word-progress.service.ts */
export type WordLearningStage = "new" | "learning" | "review" | "due";

export interface SessionStageCounts {
    new: number;
    learning: number;
    review: number;
    due: number;
}

export interface PracticeSessionPlan {
    /** New words that receive a per-word introduction before their first exercise. */
    introWords: IWord[];
    /** Ordered practice queue — due first, then learning, new, review. */
    practiceQueue: IWord[];
    stagesByWordId: Record<string, WordLearningStage>;
    counts: SessionStageCounts;
}

export function isProgressDue(
    nextReviewAt: Date | string,
    now: Date = new Date(),
): boolean {
    return new Date(nextReviewAt) <= now;
}

/** Classify a single word from its progress record. */
export function getWordLearningStage(
    progress: IWordProgressResponse | null | undefined,
    now: Date = new Date(),
): WordLearningStage {
    if (!progress) return "new";
    if (isProgressDue(progress.nextReviewAt, now)) return "due";
    if (progress.repetitions < 3) return "learning";
    return "review";
}

export function buildStagesMap(
    wordIds: string[],
    progressByWordId: Record<string, IWordProgressResponse | null> | undefined,
    now: Date = new Date(),
): Record<string, WordLearningStage> {
    const map: Record<string, WordLearningStage> = {};
    for (const id of wordIds) {
        map[id] = getWordLearningStage(progressByWordId?.[id], now);
    }
    return map;
}

function countStages(stages: Record<string, WordLearningStage>): SessionStageCounts {
    const counts: SessionStageCounts = { new: 0, learning: 0, review: 0, due: 0 };
    for (const stage of Object.values(stages)) {
        counts[stage]++;
    }
    return counts;
}

const QUEUE_PRIORITY: Record<WordLearningStage, number> = {
    due: 0,
    learning: 1,
    new: 2,
    review: 3,
};

function sortWordsForPractice(
    words: IWord[],
    stagesByWordId: Record<string, WordLearningStage>,
    progressByWordId: Record<string, IWordProgressResponse | null> | undefined,
): IWord[] {
    return [...words].sort((a, b) => {
        const stageA = stagesByWordId[a.id] ?? "new";
        const stageB = stagesByWordId[b.id] ?? "new";
        const prioDiff = QUEUE_PRIORITY[stageA] - QUEUE_PRIORITY[stageB];
        if (prioDiff !== 0) return prioDiff;

        if (stageA === "due" && stageB === "due") {
            const dueA = progressByWordId?.[a.id]?.nextReviewAt;
            const dueB = progressByWordId?.[b.id]?.nextReviewAt;
            if (dueA && dueB) {
                return new Date(dueA).getTime() - new Date(dueB).getTime();
            }
        }
        return 0;
    });
}

/** Build intro + practice queues from word progress. */
export function buildPracticeSessionPlan(
    words: IWord[],
    progressByWordId: Record<string, IWordProgressResponse | null> | undefined,
    now: Date = new Date(),
): PracticeSessionPlan {
    const stagesByWordId = buildStagesMap(
        words.map((w) => w.id),
        progressByWordId,
        now,
    );
    const counts = countStages(stagesByWordId);

    const introWords = words.filter((w) => stagesByWordId[w.id] === "new");

    const ordered = sortWordsForPractice(words, stagesByWordId, progressByWordId);

    // Light shuffle within each priority band keeps sessions fresh without breaking urgency order
    const practiceQueue: IWord[] = [];
    for (const stage of ["due", "learning", "new", "review"] as WordLearningStage[]) {
        const band = ordered.filter((w) => stagesByWordId[w.id] === stage);
        practiceQueue.push(...shuffleArray(band));
    }

    return { introWords, practiceQueue, stagesByWordId, counts };
}

export function isLeechWord(progress: IWordProgressResponse | null | undefined): boolean {
    if (!progress) return false;
    return progress.totalReviews >= 3 && progress.successRate < 50;
}

export function buildLeechWordIds(
    progressByWordId: Record<string, IWordProgressResponse | null> | undefined,
): Set<string> {
    const leeches = new Set<string>();
    if (!progressByWordId) return leeches;
    for (const [wordId, progress] of Object.entries(progressByWordId)) {
        if (isLeechWord(progress)) leeches.add(wordId);
    }
    return leeches;
}

export function stageLabel(stage: WordLearningStage): string {
    switch (stage) {
        case "new":
            return "New";
        case "learning":
            return "Learning";
        case "review":
            return "Review";
        case "due":
            return "Due";
    }
}

/** Prefer review flow when URL is generic but session is mostly recall. */
export function inferPracticeSessionKind(
    counts: SessionStageCounts,
    urlKind: PracticeSessionKind,
): PracticeSessionKind {
    if (urlKind === "review") return "review";
    if (counts.new === 0 && (counts.due > 0 || counts.learning > 0)) return "review";
    return "new";
}

export function stageHintPolicy(stage: WordLearningStage): {
    showExampleHints: boolean;
    showImageHints: boolean;
} {
    switch (stage) {
        case "new":
            return { showExampleHints: true, showImageHints: true };
        case "learning":
            return { showExampleHints: true, showImageHints: false };
        case "due":
        case "review":
            return { showExampleHints: false, showImageHints: false };
    }
}
