"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import { DifficultWordRow } from "@/components/features/learn/difficult-word-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBackNavigation } from "@/hooks/useBackNavigation.hook";
import {
    useDifficultWords,
    type DifficultWordsFilter,
} from "@/hooks/useDifficultWords.hook";
import { buildPracticeUrl } from "@/lib/practice-session";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import type { IWord } from "@/types/courses/courses.type";
import { AlertTriangle, ArrowLeft, Search, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const FILTERS: { key: DifficultWordsFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "saved", label: "Saved by me" },
    { key: "detected", label: "Keeps slipping" },
];

/**
 * Every difficult word the learner has, across every course.
 *
 * The course page carries the same list scoped to one course, but a learner's
 * hard words are not organised by course in their head — they are just the
 * words that keep catching them out. This is where the whole shelf lives, and
 * where it is managed.
 */
export default function DifficultWordsPage() {
    const router = useRouter();
    const { navigate: handleBack } = useBackNavigation("/learn");
    const [filter, setFilter] = useState<DifficultWordsFilter>("all");
    const [search, setSearch] = useState("");

    // No courseId: every course.
    const { rows, allRows, isLoading, unsuspend, unsave } = useDifficultWords(
        undefined,
        filter,
    );

    // The lists only carry word ids, so the text comes from a cross-course
    // hydrate. Keyed on ALL rows rather than the filtered view, so switching
    // filter or typing in the box does not refetch.
    const allWordIds = useMemo(
        () => allRows.map((row) => row.wordId),
        [allRows],
    );
    const { data: words, isFetching: wordsFetching } = useGetWordsByIdsQuery(
        undefined,
        allWordIds,
        allWordIds.length > 0,
    );

    const wordsById = useMemo(() => {
        const map: Record<string, IWord> = {};
        for (const word of words ?? []) map[word.id] = word;
        return map;
    }, [words]);

    const visibleRows = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return rows;
        return rows.filter((row) => {
            const word = wordsById[row.wordId];
            return (
                word?.word?.toLowerCase().includes(query) ||
                word?.meaning?.toLowerCase().includes(query)
            );
        });
    }, [rows, search, wordsById]);

    const handlePractice = () => {
        // The filtered set, not everything: narrowing to "Saved by me" and
        // hitting practice should give exactly those words. The search box is
        // deliberately excluded — it is for finding a row to manage, not for
        // building a session.
        router.push(
            buildPracticeUrl({
                wordIds: rows.map((row) => row.wordId),
                kind: "saved",
            }),
        );
    };

    const handleUnsuspend = (wordId: string) =>
        unsuspend.mutate(wordId, {
            onError: () => toast.error("Couldn't unsuspend that word"),
        });

    const handleUnsave = (wordId: string) =>
        unsave.mutate(
            { wordId, saved: false },
            { onError: () => toast.error("Couldn't remove that word") },
        );

    // Gate on data, not on fetch outcome — offline these resolve from cache.
    if (isLoading && allRows.length === 0) {
        return (
            <LoadingSection
                isLoading
                error={null}
                refetch={() => {}}
                loadingLabel="Loading your difficult words..."
            />
        );
    }

    return (
        <main className="container mx-auto w-full max-w-3xl px-3 py-4 pb-safe sm:px-4 sm:py-6">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-3 gap-1.5 rounded-lg"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back
            </Button>

            <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                    <AlertTriangle
                        className="mt-1 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                        aria-hidden
                    />
                    <div className="min-w-0">
                        <h1 className="text-xl font-bold sm:text-2xl">
                            Difficult words
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Words you saved, and words you keep slipping on.
                            Practising them early won&apos;t push back your
                            scheduled reviews.
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
                    Practice {rows.length > 0 ? rows.length : ""}
                </Button>
            </header>

            {allRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center">
                    <Sparkles
                        className="mx-auto mb-2 h-6 w-6 text-muted-foreground"
                        aria-hidden
                    />
                    <p className="text-sm font-medium">Nothing tricky right now</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Tap the bookmark on a word while you practise to save it
                        here for later.
                    </p>
                </div>
            ) : (
                <>
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap gap-1.5">
                            {FILTERS.map(({ key, label }) => (
                                <Button
                                    key={key}
                                    type="button"
                                    variant={filter === key ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilter(key)}
                                    className="h-8 rounded-lg text-xs"
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                        <div className="relative sm:ml-auto sm:w-56">
                            <Search
                                className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden
                            />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Find a word"
                                aria-label="Find a word"
                                className="h-9 rounded-lg pl-8"
                            />
                        </div>
                    </div>

                    {visibleRows.length === 0 ? (
                        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No words match that.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-1.5 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-3 dark:border-amber-800/50 dark:bg-amber-950/30">
                            {visibleRows.map((row) => (
                                <DifficultWordRow
                                    key={row.wordId}
                                    row={row}
                                    word={wordsById[row.wordId]}
                                    unsuspendPending={unsuspend.isPending}
                                    unsavePending={unsave.isPending}
                                    onUnsuspend={handleUnsuspend}
                                    onUnsave={handleUnsave}
                                />
                            ))}
                        </ul>
                    )}

                    {wordsFetching && !words && (
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                            Loading word details...
                        </p>
                    )}
                </>
            )}
        </main>
    );
}
