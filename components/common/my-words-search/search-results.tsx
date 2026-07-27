"use client";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { useSearchWordsQuery } from "@/queries/dictionary.query";
import { useSearchMyWordsQuery } from "@/queries/words.query";
import { IUserWordSearchResult, IWordSearchResult } from "@/types/courses/courses.type";
import { useVirtualizer } from "@tanstack/react-virtual";
import Image from "next/image";
import { useMemo, useRef } from "react";

export type SearchResultRow =
    | { t: "h"; id: string; label: string }
    | { t: "u"; id: string; item: IUserWordSearchResult }
    | { t: "d"; id: string; item: IWordSearchResult; idx: number }
    | { t: "e"; id: string; message: string };

/**
 * Runs both searches (the learner's own words + the dictionary) for one query
 * and flattens them into the section/row list the virtualizer renders.
 */
export function useMyWordsSearchRows(query: string) {
    const trimmed = query.trim();
    const enabled = trimmed.length > 0;
    const { data: myWords, isLoading: isMyWordsLoading } = useSearchMyWordsQuery(trimmed, enabled);
    const { data: dictWords, isLoading: isDictLoading } = useSearchWordsQuery(trimmed, enabled);

    const isLoading = enabled && (isMyWordsLoading || isDictLoading);
    const hasMyWords = (myWords?.length ?? 0) > 0;
    const hasDictWords = (dictWords?.length ?? 0) > 0;
    const hasAnswer = myWords !== undefined && dictWords !== undefined;

    const rows = useMemo((): SearchResultRow[] => {
        if (isLoading || myWords === undefined || dictWords === undefined) {
            return [];
        }
        const out: SearchResultRow[] = [];
        out.push({ t: "h", id: "sec-your", label: "Your words" });
        if (hasMyWords && myWords) {
            for (const item of myWords) {
                out.push({ t: "u", id: item.id, item });
            }
        } else {
            out.push({ t: "e", id: "empty-your", message: "No words found" });
        }
        out.push({ t: "h", id: "sec-dict", label: "Dictionary" });
        if (hasDictWords && dictWords) {
            dictWords.forEach((item, idx) => {
                out.push({ t: "d", id: `${item.langeekWordId}-${idx}`, item, idx });
            });
        } else {
            out.push({ t: "e", id: "empty-dict", message: "No results" });
        }
        return out;
    }, [hasMyWords, hasDictWords, myWords, dictWords, isLoading]);

    return { rows, isLoading, hasAnswer, hasResults: hasMyWords || hasDictWords };
}

export interface MyWordsSearchResultsProps {
    rows: SearchResultRow[];
    isLoading: boolean;
    onSelectUserWord: (item: IUserWordSearchResult) => void;
    onSelectDictWord: (item: IWordSearchResult) => void;
    /** Applied to the scroll container — owns the height budget. */
    className?: string;
}

/** Virtualized result list, shared by the inline dropdown and the search dialog. */
export function MyWordsSearchResults({
    rows,
    isLoading,
    onSelectUserWord,
    onSelectDictWord,
    className,
}: Readonly<MyWordsSearchResultsProps>) {
    const scrollParentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollParentRef.current,
        estimateSize: (index) => {
            const row = rows[index];
            if (!row) return 48;
            if (row.t === "h") return 30;
            if (row.t === "e") return 40;
            return 84;
        },
        overscan: 8,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                <LoadingSpinner size="sm" label="Searching..." />
            </div>
        );
    }

    return (
        <div ref={scrollParentRef} className={cn("overflow-y-auto overscroll-contain py-1", className)}>
            <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    if (!row) return null;
                    return (
                        <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            className="absolute top-0 left-0 w-full border-b border-border/40 last:border-b-0"
                            style={{ transform: `translateY(${virtualRow.start}px)` }}
                        >
                            {row.t === "h" && (
                                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    {row.label}
                                </p>
                            )}
                            {row.t === "e" && (
                                <div className="px-3 py-2 text-sm text-muted-foreground">{row.message}</div>
                            )}
                            {row.t === "u" && (
                                <WordResultButton
                                    word={row.item.word}
                                    partOfSpeech={row.item.partOfSpeech}
                                    meaning={row.item.meaning}
                                    imageUrl={row.item.imageUrl}
                                    footer={`${row.item.courseName} · ${row.item.lessonName}`}
                                    onClick={() => onSelectUserWord(row.item)}
                                />
                            )}
                            {row.t === "d" && (
                                <WordResultButton
                                    word={row.item.word}
                                    partOfSpeech={row.item.partOfSpeech}
                                    meaning={row.item.meaning}
                                    imageUrl={row.item.imageUrl}
                                    onClick={() => onSelectDictWord(row.item)}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function WordResultButton({
    word,
    partOfSpeech,
    meaning,
    imageUrl,
    footer,
    onClick,
}: Readonly<{
    word: string;
    partOfSpeech?: string | null;
    meaning?: string | null;
    imageUrl?: string | null;
    footer?: string;
    onClick: () => void;
}>) {
    return (
        <button
            type="button"
            className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none flex gap-2.5 cursor-pointer"
            onClick={onClick}
        >
            {imageUrl && (
                <span className="relative flex-shrink-0 w-9 h-9 rounded-md overflow-hidden bg-muted border">
                    <Image src={imageUrl} alt="" fill loading="lazy" className="object-cover" sizes="36px" />
                </span>
            )}
            <span className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium">{word}</span>
                    {partOfSpeech && (
                        <span className="text-xs text-muted-foreground italic">{partOfSpeech}</span>
                    )}
                </div>
                {meaning && <p className="mt-0.5 text-muted-foreground text-xs line-clamp-2">{meaning}</p>}
                {footer && <p className="mt-1 text-xs text-muted-foreground/80">{footer}</p>}
            </span>
        </button>
    );
}
