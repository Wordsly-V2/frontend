import type { SessionStageCounts } from "@/lib/word-progress-stage";

/** Rough session length for overview (~25–35s per word, lighter intro). */
export function estimateSessionMinutes(
    wordCount: number,
    hasIntro: boolean,
    counts: SessionStageCounts,
): number {
    const introMinutes = hasIntro ? Math.ceil(counts.new * 0.2) : 0;
    const dueWeight = counts.due > 0 ? 1.05 : 1;
    const practiceMinutes = (wordCount * 0.5 * dueWeight) / 1;
    return Math.max(1, Math.ceil(introMinutes + practiceMinutes));
}

export function formatSessionEstimate(
    wordCount: number,
    hasIntro: boolean,
    counts: SessionStageCounts,
): string {
    const minutes = estimateSessionMinutes(wordCount, hasIntro, counts);
    return minutes === 1 ? "~1 min" : `~${minutes} min`;
}
