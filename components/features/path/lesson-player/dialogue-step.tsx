"use client";

import { playPathAudio, SpeakButton } from "@/components/features/path/path-speech";
import { StepFooter } from "@/components/features/path/lesson-player/step-footer";
import { SpeakAttempt } from "@/components/features/path/speak-attempt";
import { cn } from "@/lib/utils";
import type { PathDialogue } from "@/types/path/path.type";
import { MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * DIALOGUE: the conversation line by line, as chat bubbles. `listen` plays
 * every line. `roleplay` stops on the learner's lines: they say it from the
 * Vietnamese (checked by the mic when there is one), then the English is
 * revealed and played. The feedback stays up until the next line.
 */
export function DialogueStep({
    dialogue,
    mode,
    onDone,
}: Readonly<{ dialogue: PathDialogue; mode: "listen" | "roleplay"; onDone: () => void }>) {
    // Lines shown so far; the last one is the current line.
    const [shown, setShown] = useState(1);
    const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
    const current = shown - 1;
    const line = dialogue.lines[current];
    const isLearnerTurn = mode === "roleplay" && !!line?.learnerTurn;
    const waitingForLearner = isLearnerTurn && !revealed.has(current);
    const finished = shown >= dialogue.lines.length;
    const endRef = useRef<HTMLDivElement>(null);

    // Speak each new line, unless it is the learner's turn to say it first.
    useEffect(() => {
        if (line && !(mode === "roleplay" && line.learnerTurn)) playPathAudio(line.en);
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [line, mode]);

    const reveal = useCallback(() => {
        setRevealed((prev) => new Set(prev).add(current));
        if (line) playPathAudio(line.en);
    }, [current, line]);

    return (
        <div>
            <article className="glass-surface space-y-4 rounded-3xl p-5 sm:p-7">
                <header className="space-y-1">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <MessageCircle className="h-4 w-4" aria-hidden />
                        {mode === "roleplay" ? "Role-play" : "Listen"}
                    </p>
                    <h2 className="font-display text-xl font-bold">{dialogue.title}</h2>
                    <p className="text-sm text-muted-foreground">{dialogue.situationVi}</p>
                </header>

                <ol className="space-y-3" aria-live="polite">
                    {dialogue.lines.slice(0, shown).map((l, i) => {
                        const mine = mode === "roleplay" && l.learnerTurn;
                        const hidden = mine && !revealed.has(i);
                        return (
                            <li key={i} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                                <div
                                    className={cn(
                                        "max-w-[85%] space-y-1 rounded-2xl px-4 py-3",
                                        mine ? "rounded-br-md bg-primary/10" : "rounded-bl-md bg-muted",
                                    )}
                                >
                                    <p className="text-xs font-bold text-muted-foreground">
                                        {mine ? "You" : l.speaker}
                                    </p>
                                    {hidden ? (
                                        <p className="font-medium">
                                            Say it in English: <span className="italic">{l.vi}</span>
                                        </p>
                                    ) : (
                                        <>
                                            <div className="flex items-start gap-2">
                                                <p className="font-medium">{l.en}</p>
                                                <SpeakButton text={l.en} size="icon-sm" className="-mt-1" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">{l.vi}</p>
                                        </>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
                <div ref={endRef} />
            </article>

            {isLearnerTurn && line && (
                <div className="glass-surface mt-4 rounded-3xl p-5">
                    <SpeakAttempt key={current} expected={line.en} onSettled={reveal} />
                </div>
            )}

            {!waitingForLearner && (
                <StepFooter
                    label={finished ? "Continue" : "Next line"}
                    onClick={() => (finished ? onDone() : setShown(shown + 1))}
                />
            )}
        </div>
    );
}
