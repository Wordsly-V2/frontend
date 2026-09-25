"use client";

import { playPathAudio, SpeakButton } from "@/components/features/path/path-speech";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isGapCorrect, isOrderCorrect, orderTiles, shuffleTiles } from "@/lib/path/quiz";
import { cn } from "@/lib/utils";
import type { PathQuestion } from "@/types/path/path.type";
import { useEffect, useMemo, useState } from "react";

type Props<K extends PathQuestion["kind"]> = Readonly<{
    question: Extract<PathQuestion, { kind: K }>;
    /** Set once the learner has answered; the question is then read-only. */
    answered: boolean;
    onAnswer: (correct: boolean) => void;
}>;

const KEYS = ["a", "b", "c", "d", "e", "f"];

export function ChoiceQuestion({ question, answered, onAnswer }: Props<"choice">) {
    const [picked, setPicked] = useState<number | null>(null);

    useEffect(() => {
        if (question.audioText) playPathAudio(question.audioText);
    }, [question.audioText]);

    const pick = (index: number) => {
        if (answered) return;
        setPicked(index);
        onAnswer(index === question.answer);
    };

    // a–f pick an option, like the practice engine.
    useEffect(() => {
        if (answered) return;
        const onKey = (event: KeyboardEvent) => {
            const index = KEYS.indexOf(event.key.toLowerCase());
            if (index >= 0 && index < question.options.length && !(event.target as HTMLElement)?.closest("input")) {
                setPicked(index);
                onAnswer(index === question.answer);
            }
        };
        globalThis.addEventListener("keydown", onKey);
        return () => globalThis.removeEventListener("keydown", onKey);
    }, [answered, onAnswer, question.answer, question.options.length]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                {question.audioText && <SpeakButton text={question.audioText} size="icon-lg" />}
                <p className="font-display text-xl font-bold">{question.prompt}</p>
            </div>
            <div className="grid gap-2.5">
                {question.options.map((option, i) => {
                    const isAnswer = i === question.answer;
                    return (
                        <Button
                            key={option}
                            variant="playOutline"
                            size="lg"
                            onClick={() => pick(i)}
                            disabled={answered && !isAnswer && i !== picked}
                            className={cn(
                                "h-auto min-h-12 justify-start whitespace-normal py-3 text-left",
                                answered && isAnswer && "border-[var(--brand-success)] bg-[var(--brand-success)]/10",
                                answered && i === picked && !isAnswer && "border-destructive bg-destructive/10",
                            )}
                        >
                            <kbd className="mr-1 hidden rounded-md border border-border px-1.5 text-xs text-muted-foreground sm:inline">
                                {KEYS[i]}
                            </kbd>
                            {option}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

export function GapQuestion({ question, answered, onAnswer }: Props<"gap">) {
    const [typed, setTyped] = useState("");
    const [before, after] = question.sentence.split("___");

    const check = () => {
        if (!answered && typed.trim()) onAnswer(isGapCorrect(question, typed));
    };

    return (
        <form
            className="space-y-4"
            onSubmit={(event) => {
                event.preventDefault();
                check();
            }}
        >
            <p className="text-sm font-semibold text-muted-foreground">
                Fill in the blank{question.hintVi ? ` · ${question.hintVi}` : ""}
            </p>
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-2 font-display text-xl font-bold leading-loose">
                {before && <span>{before.trim()}</span>}
                <Input
                    autoFocus
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    disabled={answered}
                    aria-label="Your answer"
                    autoCapitalize="off"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 w-40 text-center text-lg font-bold"
                />
                {after && <span>{after.trim()}</span>}
            </p>
            {!answered && (
                <Button type="submit" variant="play" size="lg" disabled={!typed.trim()}>
                    Check
                </Button>
            )}
        </form>
    );
}

export function OrderQuestion({ question, answered, onAnswer }: Props<"order">) {
    const tiles = useMemo(() => shuffleTiles(orderTiles(question.answer).map((word, i) => ({ word, i }))), [question.answer]);
    const [picked, setPicked] = useState<number[]>([]);
    const remaining = tiles.filter((tile) => !picked.includes(tile.i));
    const pickedWords = picked.map((i) => tiles.find((t) => t.i === i)!.word);

    return (
        <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground">Put the words in order</p>
            <p className="font-display text-xl font-bold">{question.vi}</p>
            <div
                aria-label="Your sentence"
                className="flex min-h-14 flex-wrap gap-2 rounded-2xl border-2 border-dashed border-border p-2"
            >
                {picked.map((i, position) => (
                    <Button
                        key={i}
                        variant="playSecondary"
                        size="sm"
                        disabled={answered}
                        onClick={() => setPicked(picked.filter((_, p) => p !== position))}
                    >
                        {tiles.find((t) => t.i === i)!.word}
                    </Button>
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
                {remaining.map((tile) => (
                    <Button
                        key={tile.i}
                        variant="playOutline"
                        size="sm"
                        disabled={answered}
                        onClick={() => setPicked([...picked, tile.i])}
                    >
                        {tile.word}
                    </Button>
                ))}
            </div>
            {!answered && (
                <Button
                    variant="play"
                    size="lg"
                    disabled={remaining.length > 0}
                    onClick={() => onAnswer(isOrderCorrect(question.answer, pickedWords))}
                >
                    Check
                </Button>
            )}
        </div>
    );
}
