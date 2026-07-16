"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { WordPill } from "@/components/common/word-pill";
import { Button } from "@/components/ui/button";
import { IWord } from "@/types/courses/courses.type";
import { Lightbulb } from "lucide-react";
import { memo, type KeyboardEvent, type RefObject } from "react";

/** Fill-in-the-blank sentence: type the word that completes the cloze prompt. */
export interface ContextModeProps {
    word: IWord;
    sentence: string;
    inputRef: RefObject<HTMLInputElement | null>;
    inputClassName: string;
    userAnswer: string;
    onAnswerChange: (value: string) => void;
    onSubmitEnter: (e: KeyboardEvent<HTMLInputElement>) => void;
    onHint: () => void;
    hintsUsed: number;
    autoCheck: boolean;
    onCheck: () => void;
}

export const ContextMode = memo(function ContextMode({
    word,
    sentence,
    inputRef,
    inputClassName,
    userAnswer,
    onAnswerChange,
    onSubmitEnter,
    onHint,
    hintsUsed,
    autoCheck,
    onCheck,
}: Readonly<ContextModeProps>) {
    return (
        <div className="space-y-5 text-center">
            <div>
                <AdaptiveText
                    text={sentence}
                    role="sentence"
                    align="center"
                    className="px-2 mb-2 text-foreground/90"
                />
                <AdaptiveText
                    text={word.meaning}
                    role="meaning"
                    align="center"
                    className="mb-2"
                />
                {word.partOfSpeech && <WordPill size="md">{word.partOfSpeech}</WordPill>}
            </div>
            <input
                ref={inputRef}
                type="text"
                autoFocus
                placeholder="Type the missing word…"
                value={userAnswer}
                onChange={(e) => onAnswerChange(String(e.target.value).toLowerCase())}
                onKeyDown={onSubmitEnter}
                className={inputClassName}
            />
            <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={onHint} className="gap-2 rounded-xl">
                    <Lightbulb className="h-4 w-4" />
                    Hint {hintsUsed > 0 ? `(${hintsUsed})` : ""}
                </Button>
                {!autoCheck && (
                    <Button onClick={onCheck} disabled={!userAnswer.trim()} className="rounded-xl">
                        Check
                    </Button>
                )}
            </div>
        </div>
    );
});
