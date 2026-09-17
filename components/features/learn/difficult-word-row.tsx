"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DifficultWordRowData } from "@/hooks/useDifficultWords.hook";
import type { IWord } from "@/types/courses/courses.type";
import { Bookmark, RotateCcw, X } from "lucide-react";

interface DifficultWordRowProps {
    row: DifficultWordRowData;
    /** The word entity, when its text has been hydrated. */
    word?: IWord;
    onUnsuspend: (wordId: string) => void;
    onUnsave: (wordId: string) => void;
    unsuspendPending?: boolean;
    unsavePending?: boolean;
}

/** One row of the difficult-words list, shared by the course card and the page. */
export function DifficultWordRow({
    row,
    word,
    onUnsuspend,
    onUnsave,
    unsuspendPending,
    unsavePending,
}: Readonly<DifficultWordRowProps>) {
    return (
        <li className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/60 bg-white/60 px-3 py-2 text-sm dark:border-amber-800/40 dark:bg-transparent">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-amber-900 dark:text-amber-100">
                        {word?.word ?? "This word"}
                    </span>
                    {row.isSaved && (
                        <Badge
                            variant="secondary"
                            className="h-5 gap-1 px-1.5 text-[10px]"
                        >
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
                {word?.meaning && (
                    <span className="mt-0.5 block truncate text-xs text-amber-800/80 dark:text-amber-200/80">
                        {word.meaning}
                    </span>
                )}
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
                        disabled={unsuspendPending}
                        onClick={() => onUnsuspend(row.wordId)}
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
                        disabled={unsavePending}
                        onClick={() => onUnsave(row.wordId)}
                        className="h-8 w-8 rounded-lg text-amber-800 dark:text-amber-200"
                    >
                        <X className="h-4 w-4" aria-hidden />
                    </Button>
                )}
            </div>
        </li>
    );
}
