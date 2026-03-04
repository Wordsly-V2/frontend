"use client";

import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import WordDetailDialog from "@/components/features/manage/word-detail-dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { useLangeekWordDetailsQuery, useSearchWordsQuery } from "@/queries/dictionary.query";
import { useGetWordsByIdsQuery, useSearchMyWordsQuery } from "@/queries/words.query";
import { IUserWordSearchResult, IWordSearchResult, WordDetailView } from "@/types/courses/courses.type";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

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

    const [detailUserWord, setDetailUserWord] = useState<IUserWordSearchResult | null>(null);
    const [detailDictWord, setDetailDictWord] = useState<IWordSearchResult | null>(null);

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
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg max-h-72 overflow-y-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                            <LoadingSpinner size="sm" label="Searching..." />
                        </div>
                    )}
                    {!isLoading && (
                        <>
                            {/* Your words section */}
                            <div className="py-1">
                                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                                    Your words
                                </p>
                                {hasMyWords ? (
                                    <ul>
                                        {myWords!.map((item) => (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none border-b border-border/50 last:border-b-0 flex gap-2.5"
                                                    onClick={() => handleSelectUserWord(item)}
                                                >
                                                    {item.imageUrl && (
                                                        <span className="relative flex-shrink-0 w-9 h-9 rounded-md overflow-hidden bg-muted border">
                                                            <Image
                                                                src={item.imageUrl}
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
                                                            <span className="font-medium">{item.word}</span>
                                                            {item.partOfSpeech && (
                                                                <span className="text-xs text-muted-foreground italic">
                                                                    {item.partOfSpeech}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.meaning && (
                                                            <p className="mt-0.5 text-muted-foreground text-xs line-clamp-2">
                                                                {item.meaning}
                                                            </p>
                                                        )}
                                                        <p className="mt-1 text-xs text-muted-foreground/80">
                                                            {item.courseName} · {item.lessonName}
                                                        </p>
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">No words found</div>
                                )}
                            </div>
                            {/* Dictionary section */}
                            <div className="py-1">
                                <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                                    Dictionary
                                </p>
                                {hasDictWords ? (
                                    <ul>
                                        {dictWords!.map((item, idx) => (
                                            <li key={`${item.langeekWordId}-${idx}`}>
                                                <button
                                                    type="button"
                                                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted focus:bg-muted focus:outline-none border-b border-border/50 last:border-b-0 flex gap-2.5"
                                                    onClick={() => handleSelectDictWord(item)}
                                                >
                                                    {item.imageUrl && (
                                                        <span className="relative flex-shrink-0 w-9 h-9 rounded-md overflow-hidden bg-muted border">
                                                            <Image
                                                                src={item.imageUrl}
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
                                                            <span className="font-medium">{item.word}</span>
                                                            {item.partOfSpeech && (
                                                                <span className="text-xs text-muted-foreground italic">
                                                                    {item.partOfSpeech}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.meaning && (
                                                            <p className="mt-0.5 text-muted-foreground text-xs line-clamp-2">
                                                                {item.meaning}
                                                            </p>
                                                        )}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
            <WordDetailDialog
                word={dialogWord}
                isOpen={dialogOpen}
                onClose={closeDialog}
                courseId={dialogCourseId}
                lessonId={dialogLessonId}
                isLoading={dialogLoadingSpinner}
                isNotFound={dialogNotFound}
            />
        </div>
    );
}
