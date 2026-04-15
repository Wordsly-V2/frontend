"use client";

import { Button } from "@/components/ui/button";
import { useGetDueWordIdsQuery } from "@/queries/word-progress.query";
import {
    DEFAULT_DUE_WORDS_LIMIT,
    DUE_WORDS_LIMIT_STORAGE_KEY,
    parseDueWordsLimit,
} from "@/lib/due-words-limit";
import { getLastLearnCourse } from "@/lib/learning-session";
import { getLocalStorageItem } from "@/lib/local-storage";
import { BookOpen, Brain, ChevronRight, Library } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";

export function LearnQuickActions() {
    const router = useRouter();
    const pathname = usePathname();
    const [last, setLast] = useState<ReturnType<typeof getLastLearnCourse>>(null);
    const [dueWordsLimit, setDueWordsLimit] = useState(DEFAULT_DUE_WORDS_LIMIT);
    const [dueWordsLimitReady, setDueWordsLimitReady] = useState(false);

    useEffect(() => {
        const func = () => {
            setLast(getLastLearnCourse());
            startTransition(() => {
                const raw = getLocalStorageItem(DUE_WORDS_LIMIT_STORAGE_KEY);
                setDueWordsLimit(parseDueWordsLimit(raw, DEFAULT_DUE_WORDS_LIMIT));
                setDueWordsLimitReady(true);
            });
        }
        func();
    }, [pathname]);

    const { data: dueIds, isLoading: dueLoading } = useGetDueWordIdsQuery(
        last?.id,
        undefined,
        dueWordsLimit,
        true,
        !!last?.id && dueWordsLimitReady && dueWordsLimit > 0,
    );

    const dueCount = dueIds?.wordIds.length ?? 0;

    const handleReviewDue = () => {
        if (!last || dueCount === 0) return;
        const wordIds = dueIds!.wordIds.join(",");
        router.push(
            `/learn/practice?courseId=${last.id}&courseName=${encodeURIComponent(last.name)}&wordIds=${wordIds}`,
        );
    };

    return (
        <nav
            aria-label="Quick learning actions"
            className="mb-6 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:p-5"
        >
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 shrink-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Next step
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Continue where you left off — or jump into review.
                    </p>
                </div>
                <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:flex-wrap sm:justify-end">
                    {last ? (
                        <>
                            <Button
                                variant="default"
                                className=" min-w-0 max-w-full !shrink justify-between gap-2 overflow-hidden rounded-xl sm:min-w-0"
                                asChild
                            >
                                <Link
                                    href={`/learn/courses/${last.id}`}
                                    title={`Continue: ${last.name}`}
                                    className="min-w-0 max-w-full"
                                >
                                    <span className="flex min-h-0 min-w-0 flex-1 items-center gap-2">
                                        <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                                        <span className="min-w-0 truncate text-left">
                                            Continue: {last.name}
                                        </span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full rounded-xl gap-2 border-primary/25 sm:w-auto"
                                disabled={dueLoading || dueCount === 0}
                                onClick={handleReviewDue}
                            >
                                <Brain className="h-4 w-4" aria-hidden />
                                {dueLoading
                                    ? "Loading…"
                                    : dueCount > 0
                                      ? `Review due (${dueCount})`
                                      : "No due words here"}
                            </Button>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground py-2">
                            Open any course below to start — we&apos;ll remember it for next time.
                        </p>
                    )}
                    <Button variant="secondary" className="w-full rounded-xl gap-2 sm:w-auto" asChild>
                        <a href="#course-library">
                            <Library className="h-4 w-4" aria-hidden />
                            Browse courses
                        </a>
                    </Button>
                </div>
            </div>
        </nav>
    );
}
