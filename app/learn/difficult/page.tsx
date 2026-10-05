"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import { PageHeader, PageShell } from "@/components/common/page";
import { DifficultWordRow } from "@/components/features/learn/difficult-word-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBackNavigation } from "@/hooks/useBackNavigation.hook";
import {
    useDifficultWords,
    type DifficultWordsFilter,
} from "@/hooks/useDifficultWords.hook";
import { itemToWord } from "@/lib/path/item-to-word";
import { PATH_REVIEW_SESSION_SIZE } from "@/lib/path/path-tree";
import { buildPracticeUrl } from "@/lib/practice-session";
import { usePathItemsQuery } from "@/queries/path.query";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import type { IWord } from "@/types/courses/courses.type";
import { ArrowLeft, Route, Search, Sparkles, Zap } from "lucide-react";
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

    // The lists only carry ids, so the text comes from a hydrate: vocabulary
    // words across every course, and saved Wordsly Path items from
    // curriculum-service. Keyed on ALL rows rather than the filtered view, so
    // switching filter or typing in the box does not refetch.
    const allWordIds = useMemo(
        () => allRows.filter((row) => row.source === "vocab").map((row) => row.wordId),
        [allRows],
    );
    const allPathIds = useMemo(
        () => allRows.filter((row) => row.source === "path").map((row) => row.wordId),
        [allRows],
    );
    const { data: words, isFetching: wordsFetching } = useGetWordsByIdsQuery(
        undefined,
        allWordIds,
        allWordIds.length > 0,
    );
    const { data: pathItems } = usePathItemsQuery(allPathIds);

    const wordsById = useMemo(() => {
        const map: Record<string, IWord> = {};
        for (const word of words ?? []) map[word.id] = word;
        for (const item of pathItems ?? []) map[item.id] = itemToWord(item);
        return map;
    }, [words, pathItems]);

    const searchedRows = useMemo(() => {
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
    // Path items are practised on their own page (the engine needs them
    // hydrated from curriculum-service), so they get their own section.
    const visibleRows = searchedRows.filter((row) => row.source === "vocab");
    const visiblePathRows = searchedRows.filter((row) => row.source === "path");
    const vocabRows = rows.filter((row) => row.source === "vocab");
    const pathRowCount = rows.length - vocabRows.length;

    const handlePractice = () => {
        // The filtered set, not everything: narrowing to "Saved by me" and
        // hitting practice should give exactly those words. The search box is
        // deliberately excluded — it is for finding a row to manage, not for
        // building a session.
        router.push(
            buildPracticeUrl({
                wordIds: vocabRows.map((row) => row.wordId),
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
        <PageShell width="narrow">
            <PageHeader
                back={
                    <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1.5">
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Back
                    </Button>
                }
                eyebrow="Learn"
                title="Difficult words"
                description="Words you saved, and words you keep slipping on. Practising them early won't push back your scheduled reviews."
                actions={
                    <Button
                        type="button"
                        variant="play"
                        onClick={handlePractice}
                        disabled={vocabRows.length === 0}
                        className="h-10 gap-2"
                    >
                        <Zap className="h-4 w-4" aria-hidden />
                        Practice {vocabRows.length > 0 ? vocabRows.length : ""}
                    </Button>
                }
            />

            {allRows.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-border/80 p-8 text-center">
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

                    {visibleRows.length === 0 && visiblePathRows.length === 0 ? (
                        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No words match that.
                        </p>
                    ) : visibleRows.length === 0 ? null : (
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

                    {visiblePathRows.length > 0 && (
                        <section className="mt-5" aria-labelledby="path-saved-heading">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <h2
                                    id="path-saved-heading"
                                    className="flex items-center gap-1.5 text-sm font-semibold"
                                >
                                    <Route className="h-4 w-4 text-primary" aria-hidden />
                                    From Wordsly Path
                                </h2>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push("/path/review/saved")}
                                    className="h-8 gap-1.5 rounded-lg"
                                >
                                    <Zap className="h-3.5 w-3.5" aria-hidden />
                                    Practice {Math.min(pathRowCount, PATH_REVIEW_SESSION_SIZE)}
                                </Button>
                            </div>
                            <ul className="flex flex-col gap-1.5 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-3 dark:border-amber-800/50 dark:bg-amber-950/30">
                                {visiblePathRows.map((row) => (
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
                        </section>
                    )}

                    {wordsFetching && !words && (
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                            Loading word details...
                        </p>
                    )}
                </>
            )}
        </PageShell>
    );
}
