"use client";

import { Button } from "@/components/ui/button";
import { IWord } from "@/types/courses/courses.type";
import { Play, Volume2 } from "lucide-react";

export interface WordsIntroProps {
    words: IWord[];
    onStart: () => void;
    /** Intro text above the word list. Default: "Review the words below. When you're ready, start practice." */
    description?: string;
    /** Label for the start button. Default: "Start Practice" */
    actionLabel?: string;
}

export default function WordsIntro({
    words,
    onStart,
    description = "Review the words below. When you're ready, start practice.",
    actionLabel = "Start Practice",
}: Readonly<WordsIntroProps>) {
    return (
        <div className="flex flex-col flex-1 animate-in fade-in duration-300">
            <div className="flex flex-row justify-between items-center py-4 border-b border-border">
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>

                <Button onClick={onStart} size="lg" className="gap-2">
                    <Play className="h-4 w-4" />
                    {actionLabel}
                </Button>   
            </div>
            <ul className="space-y-3 flex-1 overflow-y-auto pb-4 pr-1">
                {words.map((word, i) => (
                    <li
                        key={word.id}
                        className="flex items-start gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
                    >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                            {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{word.word}</p>
                            {word.partOfSpeech && (
                                <p className="text-xs text-muted-foreground mt-0.5">{word.partOfSpeech}</p>
                            )}
                            {word.pronunciation && (
                                <p className="text-xs text-muted-foreground mt-0.5">{word.pronunciation}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">{word.meaning}</p>
                        </div>
                        {word.audioUrl && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="flex-shrink-0 h-9 w-9"
                                onClick={() => {
                                    const audio = new Audio(word.audioUrl);
                                    audio.play().catch(console.error);
                                }}
                            >
                                <Volume2 className="h-4 w-4" />
                            </Button>
                        )}
                    </li>
                ))}
            </ul>
            <div className="pt-4 border-t border-border flex-shrink-0">
                <Button onClick={onStart} size="lg" className="w-full gap-2">
                    <Play className="h-4 w-4" />
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
}
