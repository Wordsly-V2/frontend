"use client";

import { playPathAudio, SpeakButton } from "@/components/features/path/path-speech";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shuffleTiles } from "@/lib/path/quiz";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

/**
 * The question views, shared by the lesson quiz (which grades on the client
 * and shows the verdict) and the checkpoint (graded on the server, so it has
 * no answers to show). Each reports what the learner answered, not whether it
 * was right.
 */
type Props<Q, R> = Readonly<{
    question: Q;
    /** Set once the learner has answered; the question is then read-only. */
    answered: boolean;
    onAnswer: (response: R) => void;
    /** Label of the confirm button (gap, order). */
    submitLabel?: string;
}>;

const KEYS = ["a", "b", "c", "d", "e", "f"];

export function ChoiceQuestion({
    question,
    answered,
    onAnswer,
    correctIndex,
}: Props<{ prompt: string; audioText?: string; options: string[] }, number> & {
    /** Highlights the right option once answered; omitted when it is unknown. */
    correctIndex?: number;
}) {
    const [picked, setPicked] = useState<number | null>(null);

    useEffect(() => {
        if (question.audioText) playPathAudio(question.audioText);
    }, [question.audioText]);

    const pick = (index: number) => {
        if (answered) return;
        setPicked(index);
        onAnswer(index);
    };

    // a–f pick an option, like the practice engine.
    useEffect(() => {
        if (answered) return;
        const onKey = (event: KeyboardEvent) => {
            const index = KEYS.indexOf(event.key.toLowerCase());
            if (index >= 0 && index < question.options.length && !(event.target as HTMLElement)?.closest("input")) {
                setPicked(index);
                onAnswer(index);
            }
        };
        globalThis.addEventListener("keydown", onKey);
        return () => globalThis.removeEventListener("keydown", onKey);
    }, [answered, onAnswer, question.options.length]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                {question.audioText && <SpeakButton text={question.audioText} size="icon-lg" />}
                <p className="font-display text-xl font-bold">{question.prompt}</p>
            </div>
            <div className="grid gap-2.5">
                {question.options.map((option, i) => {
                    const graded = answered && correctIndex !== undefined;
                    const isAnswer = i === correctIndex;
                    return (
                        <Button
                            key={option}
                            variant="playOutline"
                            size="lg"
                            onClick={() => pick(i)}
                            disabled={answered && !isAnswer && i !== picked}
                            className={cn(
                                "h-auto min-h-12 justify-start whitespace-normal py-3 text-left",
                                graded && isAnswer && "border-[var(--brand-success)] bg-[var(--brand-success)]/10",
                                graded && i === picked && !isAnswer && "border-destructive bg-destructive/10",
                                answered && !graded && i === picked && "border-primary bg-primary/10",
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

export function GapQuestion({
    question,
    answered,
    onAnswer,
    submitLabel = "Check",
}: Props<{ sentence: string; hintVi?: string }, string>) {
    const [typed, setTyped] = useState("");
    const [before, after] = question.sentence.split("___");

    const check = () => {
        if (!answered && typed.trim()) onAnswer(typed);
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
                    {submitLabel}
                </Button>
            )}
        </form>
    );
}

export function OrderQuestion({
    question,
    answered,
    onAnswer,
    submitLabel = "Check",
}: Props<{ vi: string; words: readonly string[] }, string[]>) {
    const { words } = question;
    const tiles = useMemo(() => shuffleTiles(words.map((word, i) => ({ word, i }))), [words]);
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
                    onClick={() => onAnswer(pickedWords)}
                >
                    {submitLabel}
                </Button>
            )}
        </div>
    );
}
