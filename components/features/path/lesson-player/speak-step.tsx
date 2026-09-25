"use client";

import { playPathAudio, SpeakButton } from "@/components/features/path/path-speech";
import { StepFooter } from "@/components/features/path/lesson-player/step-footer";
import { Mic } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * SPEAK: listen, then say the line out loud. Speech scoring comes with the
 * speaking mode (P2); for now the learner moves on when they have said it.
 */
export function SpeakStep({
    lines,
    onDone,
}: Readonly<{ lines: { en: string; vi: string }[]; onDone: () => void }>) {
    const [index, setIndex] = useState(0);
    const line = lines[index];
    const last = index >= lines.length - 1;

    // Play each line once when it appears.
    useEffect(() => {
        if (line) playPathAudio(line.en);
    }, [line]);

    // The player never renders an empty step.
    if (!line) return null;

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
                <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    <Mic className="h-4 w-4" aria-hidden />
                    Your turn
                </p>
            </article>
            <StepFooter label="I said it" onClick={() => (last ? onDone() : setIndex(index + 1))} />
        </div>
    );
}
