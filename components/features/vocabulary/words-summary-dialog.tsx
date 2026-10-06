"use client";

import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { playAudioUrl } from "@/lib/practice-audio";
import { cn } from "@/lib/utils";
import { IWord } from "@/types/courses/courses.type";
import { Check, Volume2 } from "lucide-react";
import { WordPill } from "@/components/common/word-pill";

interface WordsSummaryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    words: IWord[];
    currentIndex: number;
}

/**
 * The session's queue as a list: done words ticked, the current one marked,
 * each with its meaning and audio. Opens scrolled to the current word.
 */
export default function WordsSummaryDialog({
    isOpen,
    onClose,
    words,
    currentIndex,
}: Readonly<WordsSummaryDialogProps>) {
    const currentRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        // After the open animation has laid the list out.
        const id = requestAnimationFrame(() => currentRef.current?.scrollIntoView({ block: "center" }));
        return () => cancelAnimationFrame(id);
    }, [isOpen]);

    const done = Math.min(currentIndex, words.length);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
                <DialogHeader className="shrink-0 border-b border-border/70 px-6 pb-4 pt-6">
                    <DialogTitle>Words in this session</DialogTitle>
                    <DialogDescription>
                        {done} of {words.length} done
                    </DialogDescription>
                </DialogHeader>

                <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:pb-3">
                    {words.map((word, index) => {
                        const isCurrent = index === currentIndex;
                        const isDone = index < currentIndex;
                        return (
                            <li
                                key={`${word.id}-${index}`}
                                ref={isCurrent ? currentRef : undefined}
                                aria-current={isCurrent ? "step" : undefined}
                                className={cn(
                                    "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                                    isCurrent && "bg-primary/10 dark:bg-primary/15",
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                                        isCurrent && "bg-primary text-primary-foreground",
                                        isDone && "bg-[var(--brand-success)]/15 text-green-600 dark:text-green-400",
                                        !isCurrent && !isDone && "bg-muted text-muted-foreground",
                                    )}
                                >
                                    {isDone ? <Check className="h-4 w-4" aria-label="Done" /> : index + 1}
                                </span>

                                <div className={cn("min-w-0 flex-1", isDone && "opacity-70")}>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                        <span className={cn("font-bold", isCurrent && "text-primary")}>{word.word}</span>
                                        {word.partOfSpeech && <WordPill>{word.partOfSpeech}</WordPill>}
                                        {isCurrent && (
                                            <span className="text-xs font-bold uppercase tracking-wide text-primary">Now</span>
                                        )}
                                    </div>
                                    <p className="truncate text-sm text-muted-foreground">{word.meaning}</p>
                                </div>

                                {word.audioUrl && (
                                    <button
                                        type="button"
                                        onClick={() => playAudioUrl(word.audioUrl)}
                                        aria-label={`Play ${word.word}`}
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <Volume2 className="h-4 w-4" aria-hidden />
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </DialogContent>
        </Dialog>
    );
}
