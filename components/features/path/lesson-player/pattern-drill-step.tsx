"use client";

import { playPathAudio, SpeakButton } from "@/components/features/path/path-speech";
import { StepFooter } from "@/components/features/path/lesson-player/step-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePracticeSettings } from "@/hooks/usePracticeSettings.hook";
import { normalizeAnswer } from "@/lib/path/quiz";
import { playPracticeErrorSound, playPracticeSuccessSound } from "@/lib/practice-sounds";
import { cn } from "@/lib/utils";
import type { PathItem } from "@/types/path/path.type";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

type Prompt = { cueVi: string; slots: Record<string, string>; answer: string };

/**
 * PATTERN_DRILL: the sentence frame with its slots open. The learner reads the
 * Vietnamese cue, fills each slot, then hears the whole sentence.
 */
export function PatternDrillStep({
    pattern,
    prompts,
    onDone,
}: Readonly<{ pattern: PathItem; prompts: Prompt[]; onDone: () => void }>) {
    const [index, setIndex] = useState(0);
    const prompt = prompts[index];
    const last = index >= prompts.length - 1;

    if (!prompt || !pattern.pattern) return null;

    return (
        <div>
            <p className="mb-3 text-sm font-semibold text-muted-foreground">
                Pattern practice · {index + 1} of {prompts.length}
            </p>
            {/* Keyed so each prompt starts empty. */}
            <DrillPrompt
                key={index}
                template={pattern.pattern.template}
                prompt={prompt}
                last={last}
                onNext={() => (last ? onDone() : setIndex(index + 1))}
            />
        </div>
    );
}

function DrillPrompt({
    template,
    prompt,
    last,
    onNext,
}: Readonly<{ template: string; prompt: Prompt; last: boolean; onNext: () => void }>) {
    const { settings } = usePracticeSettings();
    const slotNames = Object.keys(prompt.slots);
    const [values, setValues] = useState<Record<string, string>>({});
    const [verdict, setVerdict] = useState<boolean | null>(null);
    const answered = verdict !== null;
    const complete = slotNames.every((name) => values[name]?.trim());

    const check = () => {
        if (answered || !complete) return;
        const correct = slotNames.every(
            (name) => normalizeAnswer(values[name] ?? "") === normalizeAnswer(prompt.slots[name]),
        );
        setVerdict(correct);
        if (settings.soundEnabled) (correct ? playPracticeSuccessSound : playPracticeErrorSound)();
        playPathAudio(prompt.answer);
    };

    const parts = template.split(/(\{\w+\})/g);

    return (
        <>
            <form
                className="glass-surface space-y-5 rounded-3xl p-5 sm:p-7"
                onSubmit={(event) => {
                    event.preventDefault();
                    check();
                }}
            >
                <p className="font-display text-xl font-bold">{prompt.cueVi}</p>
                <p className="flex flex-wrap items-baseline gap-2 text-xl font-semibold leading-loose">
                    {parts.map((part, i) => {
                        const name = /^\{(\w+)\}$/.exec(part)?.[1];
                        if (!name) return part.trim() ? <span key={i}>{part.trim()}</span> : null;
                        // A slot the prompt doesn't fill shows its sample instead.
                        if (!(name in prompt.slots)) return <span key={i}>…</span>;
                        return (
                            <Input
                                key={i}
                                autoFocus={name === slotNames[0]}
                                value={values[name] ?? ""}
                                onChange={(event) => setValues({ ...values, [name]: event.target.value })}
                                disabled={answered}
                                aria-label={`Fill in ${name}`}
                                autoCapitalize="off"
                                autoComplete="off"
                                spellCheck={false}
                                className={cn(
                                    "h-11 w-44 text-center text-lg font-bold",
                                    answered &&
                                        (normalizeAnswer(values[name] ?? "") === normalizeAnswer(prompt.slots[name])
                                            ? "border-[var(--brand-success)]"
                                            : "border-destructive"),
                                )}
                            />
                        );
                    })}
                </p>
                {!answered && (
                    <Button type="submit" variant="play" size="lg" disabled={!complete}>
                        Check
                    </Button>
                )}
            </form>

            {answered && (
                <StepFooter label={last ? "Continue" : "Next"} onClick={onNext}>
                    <div
                        role="status"
                        className={cn(
                            "flex items-center gap-3 rounded-2xl p-4",
                            verdict ? "bg-[var(--brand-success)]/12" : "bg-destructive/10",
                        )}
                    >
                        {verdict ? (
                            <CheckCircle2 className="h-6 w-6 shrink-0 text-[var(--brand-success)]" aria-hidden />
                        ) : (
                            <XCircle className="h-6 w-6 shrink-0 text-destructive" aria-hidden />
                        )}
                        <p className="min-w-0 flex-1 font-semibold">{prompt.answer}</p>
                        <SpeakButton text={prompt.answer} size="icon-sm" />
                    </div>
                </StepFooter>
            )}
        </>
    );
}
