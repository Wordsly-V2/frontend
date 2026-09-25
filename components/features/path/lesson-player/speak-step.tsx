"use client";

import { playPathAudio, SpeakButton } from "@/components/features/path/path-speech";
import { SpeakAttempt } from "@/components/features/path/speak-attempt";
import { StepFooter } from "@/components/features/path/lesson-player/step-footer";
import { useCallback, useEffect, useState } from "react";

/**
 * SPEAK: listen, then say the line out loud. The mic checks it when the
 * browser can recognise speech; otherwise the learner checks themselves.
 * Lines aren't items, so nothing here goes to FSRS: the score is feedback.
 */
export function SpeakStep({
    lines,
    onDone,
}: Readonly<{ lines: { en: string; vi: string }[]; onDone: () => void }>) {
    const [index, setIndex] = useState(0);
    const [settled, setSettled] = useState(false);
    const line = lines[index];
    const last = index >= lines.length - 1;
    const settle = useCallback(() => setSettled(true), []);

    // Play each line once when it appears.
    useEffect(() => {
        if (line) playPathAudio(line.en);
    }, [line]);

    // The player never renders an empty step.
    if (!line) return null;

    const next = () => {
        if (last) {
            onDone();
            return;
        }
        setSettled(false);
        setIndex(index + 1);
    };

    return (
        <div>
            <article className="glass-surface space-y-6 rounded-3xl p-5 text-center sm:p-8">
                <p className="text-sm font-semibold text-muted-foreground">
                    Listen, then say it out loud · {index + 1} of {lines.length}
                </p>
                <div className="flex flex-col items-center gap-4">
                    <SpeakButton text={line.en} size="icon-lg" className="h-14 w-14" />
                    <p className="font-display text-2xl font-bold sm:text-3xl">{line.en}</p>
                    <p className="text-muted-foreground">{line.vi}</p>
                </div>
                <SpeakAttempt key={index} expected={line.en} onSettled={settle} />
            </article>
            <StepFooter label={last ? "Continue" : "Next"} onClick={next} disabled={!settled} />
        </div>
    );
}
