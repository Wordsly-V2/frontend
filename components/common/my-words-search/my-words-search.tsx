"use client";

import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import QuickAddWordDialog from "@/components/features/manage/quick-add-word-dialog";
import WordDetailDialog from "@/components/features/manage/word-detail-dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { useLangeekWordDetailsQuery, useSearchWordsQuery } from "@/queries/dictionary.query";
import { useGetWordsByIdsQuery, useSearchMyWordsQuery } from "@/queries/words.query";
import { IUserWordSearchResult, IWordSearchResult, WordDetailView } from "@/types/courses/courses.type";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";

type SearchResultRow =
    | { t: "h"; id: string; label: string }
    | { t: "u"; id: string; item: IUserWordSearchResult }
    | { t: "d"; id: string; item: IWordSearchResult; idx: number }
    | { t: "e"; id: string; message: string };

function langeekToWordDetailView(d: {
    word: string;
    meaning: string;
    partOfSpeech: string;
    pronunciation: string;
    audioUrl: string;
    examples: string[];
    imageUrl: string;
}): WordDetailView {
    return {
        word: d.word,
        meaning: d.meaning,
        partOfSpeech: d.partOfSpeech,
        pronunciation: d.pronunciation || undefined,
        audioUrl: d.audioUrl || undefined,
        imageUrl: d.imageUrl || undefined,
        example: d.examples?.length ? JSON.stringify(d.examples) : undefined,
    };
}

export interface MyWordsSearchProps {
    onSelect?: (item: IUserWordSearchResult) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
}

export function MyWordsSearch({
    onSelect,
    placeholder = "Search your words...",
    className,
    inputClassName,
}: Readonly<MyWordsSearchProps>) {
    const [value, setValue] = useState("");
    const debouncedQuery = useDebounce(value.trim(), 300);
    const { data: myWords, isLoading: isMyWordsLoading } = useSearchMyWordsQuery(debouncedQuery, true);
    const { data: dictWords, isLoading: isDictLoading } = useSearchWordsQuery(debouncedQuery, true);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollParentRef = useRef<HTMLDivElement>(null);

    const [detailUserWord, setDetailUserWord] = useState<IUserWordSearchResult | null>(null);
    const [detailDictWord, setDetailDictWord] = useState<IWordSearchResult | null>(null);
    const [quickAddWord, setQuickAddWord] = useState<WordDetailView | null>(null);

    const { data: fullUserWord } = useGetWordsByIdsQuery(
        detailUserWord?.courseId ?? "",
        detailUserWord ? [detailUserWord.id] : [],
        !!detailUserWord
    );
    const { data: langeekDetails, isSuccess: isLangeekSuccess } = useLangeekWordDetailsQuery(
        detailDictWord?.word ?? "",
        detailDictWord?.partOfSpeech ?? "",
        !!detailDictWord
    );

    const hasQuery = value.trim().length > 0;
    const isLoading = isMyWordsLoading || isDictLoading;
    const hasMyWords = (myWords?.length ?? 0) > 0;
    const hasDictWords = (dictWords?.length ?? 0) > 0;
    const showList = open && hasQuery && (isLoading || hasMyWords || hasDictWords || (myWords !== undefined && dictWords !== undefined));

    const dialogOpen = !!detailUserWord || !!detailDictWord;
    const dialogNotFound = !!detailDictWord && isLangeekSuccess && langeekDetails == null;
    const dialogWord: WordDetailView | null = (() => {
        if (detailUserWord && fullUserWord?.[0]) {
            return { ...fullUserWord[0], courseId: detailUserWord.courseId, lessonId: detailUserWord.lessonId };
        }
        if (detailDictWord && langeekDetails) {
            return langeekToWordDetailView(langeekDetails);
        }
        return null;
    })();
    const dialogLoadingSpinner = (!!detailUserWord && !fullUserWord?.length) || (!!detailDictWord && !isLangeekSuccess && !dialogNotFound);
    const dialogCourseId = detailUserWord?.courseId;
    const dialogLessonId = detailUserWord?.lessonId;

    const closeDialog = () => {
        setDetailUserWord(null);
        setDetailDictWord(null);
    };

    const handleSelectUserWord = (item: IUserWordSearchResult) => {
        onSelect?.(item);
        setDetailUserWord(item);
        setDetailDictWord(null);
        setValue("");
        setOpen(false);
    };

    const handleSelectDictWord = (item: IWordSearchResult) => {
        setDetailDictWord(item);
        setDetailUserWord(null);
        setValue("");
        setOpen(false);
    };

    const resultRows = useMemo((): SearchResultRow[] => {
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

    const rowVirtualizer = useVirtualizer({
        count: resultRows.length,
        getScrollElement: () => scrollParentRef.current,
        estimateSize: (index) => {
            const row = resultRows[index];
            if (!row) return 48;
            if (row.t === "h") return 30;
            if (row.t === "e") return 40;
            return 84;
        },
        overscan: 8,
    });

    return (
        <div className={`relative min-w-0 max-w-[220px] sm:max-w-[280px] ${className ?? ""}`} ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => value.trim() && setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 180)}
                    className={`pl-8 h-8 sm:h-9 text-sm bg-muted/50 border-border/80 ${inputClassName ?? ""}`}
                    autoComplete="off"
                />
            </div>
            {showList && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg">
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                            <LoadingSpinner size="sm" label="Searching..." />
                        </div>
                    )}
                    {!isLoading && (
                        <div
                            ref={scrollParentRef}
                            className="max-h-72 overflow-y-auto overscroll-contain py-1"
                        >
                            <div
                                className="relative w-full"
                                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const row = resultRows[virtualRow.index];
                                    if (!row) return null;
                                    return (
                                        <div
                                            key={virtualRow.key}
                                            data-index={virtualRow.index}
                                            ref={rowVirtualizer.measureElement}
                                            className="absolute top-0 left-0 w-full border-b border-border/40 last:border-b-0"
                                            style={{
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                        >
                                            {row.t === "h" && (
                                                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    {row.label}
                                                </p>
                                            )}
                                            {row.t === "e" && (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                                    {row.message}
                                                </div>
                                            )}
                                            {row.t === "u" && (
                                                <button
                                                    type="button"
                                                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none flex gap-2.5 cursor-pointer"
                                                    onClick={() => handleSelectUserWord(row.item)}
                                                >
                                                    {row.item.imageUrl && (
                                                        <span className="relative flex-shrink-0 w-9 h-9 rounded-md overflow-hidden bg-muted border">
                                                            <Image
                                                                src={row.item.imageUrl}
                                                                alt=""
                                                                fill
                                                                loading="lazy"
                                                                className="object-cover"
                                                                sizes="36px"
                                                            />
                                                        </span>
                                                    )}
                                                    <span className="min-w-0 flex-1">
                                                        <div className="flex items-baseline gap-2 flex-wrap">
                                                            <span className="font-medium">{row.item.word}</span>
                                                            {row.item.partOfSpeech && (
                                                                <span className="text-xs text-muted-foreground italic">
                                                                    {row.item.partOfSpeech}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {row.item.meaning && (
                                                            <p className="mt-0.5 text-muted-foreground text-xs line-clamp-2">
                                                                {row.item.meaning}
                                                            </p>
                                                        )}
                                                        <p className="mt-1 text-xs text-muted-foreground/80">
                                                            {row.item.courseName} · {row.item.lessonName}
                                                        </p>
                                                    </span>
                                                </button>
                                            )}
                                            {row.t === "d" && (
                                                <button
                                                    type="button"
                                                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none flex gap-2.5 cursor-pointer"
                                                    onClick={() => handleSelectDictWord(row.item)}
                                                >
                                                    {row.item.imageUrl && (
                                                        <span className="relative flex-shrink-0 w-9 h-9 rounded-md overflow-hidden bg-muted border">
                                                            <Image
                                                                src={row.item.imageUrl}
                                                                alt=""
                                                                fill
                                                                loading="lazy"
                                                                className="object-cover"
                                                                sizes="36px"
                                                            />
                                                        </span>
                                                    )}
                                                    <span className="min-w-0 flex-1">
                                                        <div className="flex items-baseline gap-2 flex-wrap">
                                                            <span className="font-medium">{row.item.word}</span>
                                                            {row.item.partOfSpeech && (
                                                                <span className="text-xs text-muted-foreground italic">
                                                                    {row.item.partOfSpeech}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {row.item.meaning && (
                                                            <p className="mt-0.5 text-muted-foreground text-xs line-clamp-2">
                                                                {row.item.meaning}
                                                            </p>
                                                        )}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {dialogWord && (
                <WordDetailDialog
                    word={dialogWord}
                    isOpen={dialogOpen}
                    onClose={closeDialog}
                    courseId={dialogCourseId}
                    lessonId={dialogLessonId}
                    isLoading={dialogLoadingSpinner}
                    isNotFound={dialogNotFound}
                    onQuickAdd={
                        detailDictWord
                            ? (word) => {
                                  closeDialog();
                                  setQuickAddWord(word);
                              }
                            : undefined
                    }
                />
            )}
            <QuickAddWordDialog
                isOpen={!!quickAddWord}
                onClose={() => setQuickAddWord(null)}
                initialWord={quickAddWord}
            />
        </div>
    );
}
