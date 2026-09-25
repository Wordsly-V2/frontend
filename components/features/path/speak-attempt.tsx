"use client";

import { SpeakButton } from "@/components/features/path/path-speech";
import { Button } from "@/components/ui/button";
import {
    type SpeechRecognitionErrorCode,
    useSpeechRecognition,
} from "@/hooks/useSpeechRecognition.hook";
import { isCorrectAnswer } from "@/lib/answer-quality";
import { stopSpeaking } from "@/lib/path/speech";
import { scoreSpeech, type SpeechScore } from "@/lib/speech-scoring";
import { cn } from "@/lib/utils";
import { CheckCircle2, Mic, Square } from "lucide-react";
import { useEffect, useState } from "react";

/** A learner may move on after this many tries even without a pass. */
const MAX_REQUIRED_ATTEMPTS = 2;

/** Errors that won't go away by trying again: fall back to self-grading. */
const BLOCKING_ERRORS = new Set<SpeechRecognitionErrorCode>(["not-allowed", "audio-capture", "network"]);

const FALLBACK_REASON: Partial<Record<SpeechRecognitionErrorCode, string>> = {
    "not-allowed": "The microphone is off, so check yourself this time.",
    "audio-capture": "No microphone found, so check yourself this time.",
    network: "Speech check needs a connection, so check yourself this time.",
};

/**
 * One "say this sentence" exercise. With speech recognition the learner taps
 * the mic, speaks, and sees which words came through; without it (Firefox, a
 * refused microphone, offline) they say it aloud and check themselves.
 *
 * It never traps anyone: `onSettled` fires once the sentence was said well,
 * after {@link MAX_REQUIRED_ATTEMPTS} tries, after a self-check, or on "Skip".
 * Key it by the sentence so each one starts fresh.
 */
export function SpeakAttempt({
    expected,
    onSettled,
}: Readonly<{ expected: string; onSettled: () => void }>) {
    const recognition = useSpeechRecognition();
    const [handled, setHandled] = useState<string[] | null>(null);
    const [score, setScore] = useState<SpeechScore | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [settled, setSettled] = useState(false);

    // Each new result is scored once (state updated during render, not in an effect).
    const { transcripts } = recognition;
    if (transcripts && transcripts !== handled) {
        const next = scoreSpeech(expected, transcripts);
        const tries = attempts + 1;
        setHandled(transcripts);
        setScore(next);
        setAttempts(tries);
        if ((next && isCorrectAnswer(next.quality)) || tries >= MAX_REQUIRED_ATTEMPTS) setSettled(true);
    }

    useEffect(() => {
        if (settled) onSettled();
    }, [settled, onSettled]);

    const blocked = recognition.error !== null && BLOCKING_ERRORS.has(recognition.error);
    const canRecognise = recognition.supported && !blocked;

    const listen = () => {
        // The recogniser would hear the sentence being read out.
        stopSpeaking();
        recognition.start();
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {canRecognise ? (
                <>
                    <Button
                        type="button"
                        variant={recognition.listening ? "playSecondary" : "play"}
                        size="xl"
                        onClick={recognition.listening ? recognition.stop : listen}
                        aria-pressed={recognition.listening}
                        className="gap-2"
                    >
                        {recognition.listening ? (
                            <Square className="h-5 w-5 fill-current" aria-hidden />
                        ) : (
                            <Mic className="h-5 w-5" aria-hidden />
                        )}
                        {listenLabel(recognition.listening, attempts)}
                    </Button>

                    <div role="status" aria-live="polite" className="min-h-6 w-full text-center">
                        {recognition.listening && (
                            <p className="text-muted-foreground italic">{recognition.interim || "Listening…"}</p>
                        )}
                        {!recognition.listening && recognition.error === "no-speech" && (
                            <p className="text-sm text-muted-foreground">
                                We didn&apos;t hear anything. Try again, a little closer to the mic.
                            </p>
                        )}
                        {!recognition.listening && score && <SpeechFeedback score={score} />}
                    </div>
                </>
            ) : (
                <SelfCheck
                    expected={expected}
                    reason={recognition.error ? FALLBACK_REASON[recognition.error] : undefined}
                    done={settled}
                    onDone={() => setSettled(true)}
                />
            )}

            {!settled && canRecognise && (
                <Button type="button" variant="link" size="sm" onClick={() => setSettled(true)}>
                    Can&apos;t talk right now? Skip
                </Button>
            )}
        </div>
    );
}

function listenLabel(listening: boolean, attempts: number): string {
    if (listening) return "Tap when you're done";
    return attempts === 0 ? "Tap and say it" : "Try again";
}

/** The sentence word by word, missed words marked, and how it went. */
function SpeechFeedback({ score }: Readonly<{ score: SpeechScore }>) {
    const passed = isCorrectAnswer(score.quality);
    let message = "Almost! Try the marked words again.";
    if (passed) message = score.accuracy >= 0.95 ? "Perfect!" : "Great, we understood you!";

    return (
        <div
            className={cn(
                "space-y-2 rounded-2xl p-4 text-left",
                passed ? "bg-[var(--brand-success)]/12" : "bg-destructive/10",
            )}
        >
            <p className="flex items-center gap-2 font-bold">
                {passed && <CheckCircle2 className="h-5 w-5 text-[var(--brand-success)]" aria-hidden />}
                {message}
            </p>
            <p className="text-lg leading-relaxed">
                {score.words.map((w, i) => (
                    <span
                        key={i}
                        className={cn(!w.matched && "text-destructive underline decoration-wavy underline-offset-4")}
                    >
                        {w.word}{" "}
                    </span>
                ))}
            </p>
            <p className="text-sm text-muted-foreground">
                We heard: &ldquo;{score.heard}&rdquo;
            </p>
        </div>
    );
}

/** No speech recognition: listen, say it aloud, and move on when ready. */
function SelfCheck({
    expected,
    reason,
    done,
    onDone,
}: Readonly<{ expected: string; reason?: string; done: boolean; onDone: () => void }>) {
    return (
        <div className="flex flex-col items-center gap-3 text-center">
            {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
            <p className="font-semibold">Say it out loud, then listen and compare.</p>
            <div className="flex items-center gap-3">
                <SpeakButton text={expected} label="Listen" />
                <Button type="button" variant={done ? "playOutline" : "play"} onClick={onDone} disabled={done}>
                    {done ? "Nice work!" : "I said it"}
                </Button>
            </div>
        </div>
    );
}
