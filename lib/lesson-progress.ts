import type { IWordProgressStats } from "@/types/word-progress/word-progress.type";

/** Percent of lesson words that have left the "new" stage (learning + review). */
export function computeLessonProgressPercent(
    stats: IWordProgressStats | undefined,
    totalWords: number,
): number {
    if (!stats || totalWords === 0) return 0;
    const studied = stats.learningWords + stats.reviewWords;
    return Math.round((studied / totalWords) * 100);
}
