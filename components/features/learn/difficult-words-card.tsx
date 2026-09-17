"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildPracticeUrl } from "@/lib/practice-session";
import {
    useGetSavedWordsQuery,
    useToggleSavedWordMutation,
} from "@/queries/saved-words.query";
import {
    useGetLeechesQuery,
    useUnsuspendWordMutation,
} from "@/queries/word-progress.query";
import { useAppSelector } from "@/store/hooks";
import type { IWord } from "@/types/courses/courses.type";
import { AlertTriangle, Bookmark, RotateCcw, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface DifficultWordsCardProps {
    /** Scope both lists to a single course; omit for all courses. */
    courseId?: string;
    courseName?: string;
    /** Word entities keyed by id, used to render each row's text. */
    wordsById: Record<string, IWord>;
    className?: string;
}

type Filter = "all" | "saved" | "detected";

/**
 * One screen for every word that needs extra attention, from either direction:
 * words the learner flagged themselves, and words the scheduler flagged after
 * enough lapses ("leeches"). A word can be on both lists, so they are merged
 * into one and each row says why it is there — two near-identical lists side by
 * side would just make the learner pick between them.
 *
 * "Practice these" starts a hand-picked session. Answering a word early that
 * way cannot push its review date out (the server ignores the schedule update
 * for a correct answer given ahead of time), so the list is safe to run through
 * as often as the learner likes.
 */
export function DifficultWordsCard({
    courseId,
    courseName,
    wordsById,
    className,
}: Readonly<DifficultWordsCardProps>) {
    const router = useRouter();
    const userLoginId = useAppSelector(
        (state) => state.user.profile?.userLoginId ?? null,
    );
    const { data: leechData, isLoading: leechesLoading } = useGetLeechesQuery({
        courseId,
    });
    const { data: savedData, isLoading: savedLoading } = useGetSavedWordsQuery({
        courseId,
    });
    const unsuspend = useUnsuspendWordMutation();
    const unsave = useToggleSavedWordMutation({ courseId }, userLoginId);
    const [filter, setFilter] = useState<Filter>("all");

    const rows = useMemo(() => {
        const leeches = leechData?.leeches ?? [];
        const saved = savedData?.savedWords ?? [];
        const savedIds = new Set(saved.map((word) => word.wordId));

        const merged = [
            // Saved first: the learner's own picks outrank the algorithm's.
            ...saved.map((word) => ({
                wordId: word.wordId,
                isSaved: true,
                isDetected:
                    word.isLeech ||
                    leeches.some((leech) => leech.wordId === word.wordId),
                successRate: word.successRate,
                totalReviews: word.totalReviews,
                lapses: leeches.find((l) => l.wordId === word.wordId)?.lapses ?? 0,
                suspended:
                    leeches.find((l) => l.wordId === word.wordId)?.suspendedAt !=
                    null,
                isSettled: word.isSettled,
                note: word.note,
            })),
            ...leeches
                .filter((leech) => !savedIds.has(leech.wordId))
                .map((leech) => ({
                    wordId: leech.wordId,
                    isSaved: false,
                    isDetected: true,
                    successRate: leech.successRate,
                    totalReviews: leech.totalReviews,
                    lapses: leech.lapses,
                    suspended: leech.suspendedAt != null,
                    isSettled: false,
                    note: undefined as string | undefined,
                })),
        ];

        if (filter === "saved") return merged.filter((row) => row.isSaved);
        if (filter === "detected") return merged.filter((row) => row.isDetected);
        return merged;
    }, [leechData, savedData, filter]);

    // All rows, not the filtered view: the empty state is about having nothing
    // to work on, not about the filter currently in force.
    const hasAny =
        (leechData?.leeches.length ?? 0) > 0 ||
        (savedData?.savedWords.length ?? 0) > 0;
    if (leechesLoading || savedLoading || !hasAny) return null;

    const handlePractice = () => {
        router.push(
            buildPracticeUrl({
                courseId,
                courseName,
                wordIds: rows.map((row) => row.wordId),
                kind: "saved",
            }),
        );
    };

    const handleUnsuspend = (wordId: string) => {
        unsuspend.mutate(wordId, {
            onError: () => toast.error("Couldn't unsuspend that word"),
        });
    };

    const handleUnsave = (wordId: string) => {
        unsave.mutate(
            { wordId, saved: false },
            { onError: () => toast.error("Couldn't remove that word") },
        );
    };

    const filters: { key: Filter; label: string }[] = [
        { key: "all", label: "All" },
        { key: "saved", label: "Saved by me" },
        { key: "detected", label: "Keeps slipping" },
    ];

    return (
        <section
            className={
                "mb-6 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-800/50 dark:bg-amber-950/30 " +
                (className ?? "")
            }
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                    <AlertTriangle
                        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                        aria-hidden
                    />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                            {rows.length} tricky word{rows.length === 1 ? "" : "s"}
                        </p>
                        <p className="mt-0.5 text-xs text-amber-700/90 dark:text-amber-300/90">
                            Words you saved or keep slipping on — a short round
                            helps them stick. It won&apos;t push back your reviews.
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    onClick={handlePractice}
                    disabled={rows.length === 0}
                    className="shrink-0 gap-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                >
                    <Zap className="h-4 w-4" aria-hidden />
                    Practice them
                </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {filters.map(({ key, label }) => (
                    <Button
                        key={key}
                        type="button"
                        variant={filter === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilter(key)}
                        className="h-7 rounded-lg text-xs"
                    >
                        {label}
                    </Button>
                ))}
            </div>

            <ul className="mt-3 flex flex-col gap-1.5">
                {rows.map((row) => {
                    const word = wordsById[row.wordId];
                    return (
                        <li
                            key={row.wordId}
                            className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-white/60 px-3 py-2 text-sm dark:border-amber-800/40 dark:bg-transparent"
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-medium text-amber-900 dark:text-amber-100">
                                        {word?.word ?? "This word"}
                                    </span>
                                    {row.isSaved && (
                                        <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
                                            <Bookmark className="h-3 w-3" aria-hidden />
                                            Saved
                                        </Badge>
                                    )}
                                    {row.isDetected && (
                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                            Keeps slipping
                                        </Badge>
                                    )}
                                    {row.isSettled && (
                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                            Got it now
                                        </Badge>
                                    )}
                                </div>
                                <span className="mt-0.5 block text-xs text-amber-700/80 dark:text-amber-300/80">
                                    {row.totalReviews > 0
                                        ? `${Math.round(row.successRate)}% correct`
                                        : "Not practised yet"}
                                    {row.lapses > 0 &&
                                        ` · ${row.lapses} lapse${row.lapses === 1 ? "" : "s"}`}
                                    {row.suspended && " · suspended"}
                                </span>
                                {row.note && (
                                    <span className="mt-0.5 block text-xs italic text-amber-700/70 dark:text-amber-300/70">
                                        {row.note}
                                    </span>
                                )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                                {row.suspended && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={unsuspend.isPending}
                                        onClick={() => handleUnsuspend(row.wordId)}
                                        className="h-8 gap-1.5 rounded-lg border-amber-300/60 bg-white/50 text-amber-800 dark:bg-transparent dark:text-amber-200"
                                    >
                                        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                                        Unsuspend
                                    </Button>
                                )}
                                {row.isSaved && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Remove from difficult words"
                                        disabled={unsave.isPending}
                                        onClick={() => handleUnsave(row.wordId)}
                                        className="h-8 w-8 rounded-lg text-amber-800 dark:text-amber-200"
                                    >
                                        <X className="h-4 w-4" aria-hidden />
                                    </Button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
