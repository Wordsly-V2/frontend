"use client";

import { Button } from "@/components/ui/button";
import { buildPracticeUrl } from "@/lib/practice-session";
import {
    useGetLeechesQuery,
    useUnsuspendWordMutation,
} from "@/queries/word-progress.query";
import type { IWord } from "@/types/courses/courses.type";
import { AlertTriangle, RotateCcw, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DifficultWordsCardProps {
    /** Scope the leech list to a single course; omit for all courses. */
    courseId?: string;
    courseName?: string;
    /** Word entities keyed by id, used to render each leech's text. */
    wordsById: Record<string, IWord>;
    className?: string;
}

/**
 * Surfaces repeatedly-failed ("leech") words for remediation: one tap starts a
 * flashcard-style leech practice session; suspended words can be un-suspended
 * back into the review queue.
 */
export function DifficultWordsCard({
    courseId,
    courseName,
    wordsById,
    className,
}: Readonly<DifficultWordsCardProps>) {
    const router = useRouter();
    const { data, isLoading } = useGetLeechesQuery({ courseId });
    const unsuspend = useUnsuspendWordMutation();

    const leeches = data?.leeches ?? [];
    if (isLoading || leeches.length === 0) return null;

    const wordIds = leeches.map((l) => l.wordId);

    const handlePractice = () => {
        router.push(
            buildPracticeUrl({
                courseId,
                courseName,
                wordIds,
                kind: "leech",
            }),
        );
    };

    const handleUnsuspend = (wordId: string) => {
        unsuspend.mutate(wordId, {
            onError: () => toast.error("Couldn't unsuspend that word"),
        });
    };

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
                            {leeches.length} tricky word{leeches.length === 1 ? "" : "s"}
                        </p>
                        <p className="mt-0.5 text-xs text-amber-700/90 dark:text-amber-300/90">
                            Words you keep slipping on — a short flashcard round helps them stick.
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    onClick={handlePractice}
                    className="shrink-0 gap-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                >
                    <Zap className="h-4 w-4" aria-hidden />
                    Practice them
                </Button>
            </div>

            <ul className="mt-3 flex flex-col gap-1.5">
                {leeches.map((leech) => {
                    const word = wordsById[leech.wordId];
                    const suspended = leech.suspendedAt != null;
                    return (
                        <li
                            key={leech.wordId}
                            className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-white/60 px-3 py-2 text-sm dark:border-amber-800/40 dark:bg-transparent"
                        >
                            <div className="min-w-0">
                                <span className="font-medium text-amber-900 dark:text-amber-100">
                                    {word?.word ?? "This word"}
                                </span>
                                <span className="ml-2 text-xs text-amber-700/80 dark:text-amber-300/80">
                                    {Math.round(leech.successRate)}% correct · {leech.lapses} lapse{leech.lapses === 1 ? "" : "s"}
                                    {suspended ? " · suspended" : ""}
                                </span>
                            </div>
                            {suspended && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={unsuspend.isPending}
                                    onClick={() => handleUnsuspend(leech.wordId)}
                                    className="h-8 shrink-0 gap-1.5 rounded-lg border-amber-300/60 bg-white/50 text-amber-800 dark:bg-transparent dark:text-amber-200"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                                    Unsuspend
                                </Button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
