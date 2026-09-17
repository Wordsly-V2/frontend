"use client";

import { Button } from "@/components/ui/button";
import { DifficultWordRow } from "@/components/features/learn/difficult-word-row";
import { useDifficultWords } from "@/hooks/useDifficultWords.hook";
import { buildPracticeUrl } from "@/lib/practice-session";
import type { IWord } from "@/types/courses/courses.type";
import { AlertTriangle, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** Rows shown inline before the card defers to the full page. */
const PREVIEW_LIMIT = 5;

interface DifficultWordsCardProps {
    /** Scope both lists to a single course; omit for all courses. */
    courseId?: string;
    courseName?: string;
    /** Word entities keyed by id, used to render each row's text. */
    wordsById: Record<string, IWord>;
    className?: string;
}

/**
 * This course's difficult words, in brief.
 *
 * A preview, not the whole list: the full cross-course view lives at
 * `/learn/difficult`, so a learner with sixty tricky words does not get sixty
 * rows wedged into the middle of a course page.
 *
 * "Practice them" starts a hand-picked session over everything in scope, not
 * just the previewed rows. Answering a word early that way cannot push its
 * review date out (the server ignores a schedule update for a correct answer
 * given ahead of time), so it is safe to run through as often as the learner
 * likes.
 */
export function DifficultWordsCard({
    courseId,
    courseName,
    wordsById,
    className,
}: Readonly<DifficultWordsCardProps>) {
    const router = useRouter();
    const { rows, isLoading, unsuspend, unsave } = useDifficultWords(courseId);

    if (isLoading || rows.length === 0) return null;

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
                    className="shrink-0 gap-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                >
                    <Zap className="h-4 w-4" aria-hidden />
                    Practice them
                </Button>
            </div>

            <ul className="mt-3 flex flex-col gap-1.5">
                {rows.slice(0, PREVIEW_LIMIT).map((row) => (
                    <DifficultWordRow
                        key={row.wordId}
                        row={row}
                        word={wordsById[row.wordId]}
                        unsuspendPending={unsuspend.isPending}
                        unsavePending={unsave.isPending}
                        onUnsuspend={(wordId) =>
                            unsuspend.mutate(wordId, {
                                onError: () =>
                                    toast.error("Couldn't unsuspend that word"),
                            })
                        }
                        onUnsave={(wordId) =>
                            unsave.mutate(
                                { wordId, saved: false },
                                {
                                    onError: () =>
                                        toast.error("Couldn't remove that word"),
                                },
                            )
                        }
                    />
                ))}
            </ul>

            <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-2 h-8 gap-1.5 rounded-lg text-amber-800 dark:text-amber-200"
            >
                <Link href="/learn/difficult">
                    {rows.length > PREVIEW_LIMIT
                        ? `See all ${rows.length}, across every course`
                        : "See every course's difficult words"}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
            </Button>
        </section>
    );
}
