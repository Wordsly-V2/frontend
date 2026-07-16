"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { WordPill } from "@/components/common/word-pill";
import { WordRevealHint } from "@/components/features/vocabulary/word-reveal-hint";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition.hook";
import { gradeSpokenAnswer } from "@/lib/practice-utils";
import { IWord } from "@/types/courses/courses.type";
import { Mic, MicOff } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

/** Total tries before the word is marked incorrect (1 attempt + 2 retries). */
const MAX_ATTEMPTS = 3;

/** Say-the-word mode: show the meaning, speak the word, grade the speech. */
export interface SpeakingModeProps {
    word: IWord;
    /** Word to grade the spoken answer against (matches the typed-answer path). */
    targetWord: string;
    /** Report the single, final graded outcome (after any retries). */
    onResult: (result: { correct: boolean; near: boolean; transcript: string }) => void;
    /** Escape hatch to a typed exercise — same name/role as the listening mode. */
    onUseTextFallback: () => void;
    /** Counts an "I'm stuck" reveal as a used hint (lowers the recorded quality). */
    onRevealHint?: () => void;
}

/** Build the pool of things to grade: each alternative plus its individual words. */
function collectCandidates(alternatives: string[], transcript: string): string[] {
    const base = alternatives.length > 0 ? alternatives : transcript ? [transcript] : [];
    const all = new Set<string>();
    for (const phrase of base) {
        const trimmed = phrase.trim();
        if (trimmed) all.add(trimmed);
        for (const token of trimmed.split(/\s+/)) {
            if (token) all.add(token);
        }
    }
    return [...all];
}

export const SpeakingMode = memo(function SpeakingMode({
    word,
    targetWord,
    onResult,
    onUseTextFallback,
    onRevealHint,
}: Readonly<SpeakingModeProps>) {
    const reduceMotion = useReducedMotion();

    const [attempts, setAttempts] = useState(0);
    const [lastNear, setLastNear] = useState(false);
    // Set when an attempt ended without recognising any speech (silence / noise).
    // Doesn't consume a try — we just ask the learner to speak again.
    const [notHeard, setNotHeard] = useState(false);
    const reportedRef = useRef(false);

    // Grade when an attempt ends (fired from the recognizer's `onend`, so this is
    // an event callback — not a status effect). Reports the final outcome only —
    // never per attempt — so the engine's worst-attempt merge stays consistent.
    const handleAttemptEnd = useCallback(
        ({
            transcript,
            alternatives,
            heard,
        }: {
            transcript: string;
            alternatives: string[];
            heard: boolean;
        }) => {
            if (reportedRef.current) return;
            // Nothing recognised: don't waste an attempt — prompt another try.
            if (!heard) {
                setNotHeard(true);
                return;
            }
            setNotHeard(false);
            const candidates = collectCandidates(alternatives, transcript);
            const match = gradeSpokenAnswer(candidates, targetWord);
            const correct = match !== "wrong";
            const near = match === "near";

            if (correct) {
                reportedRef.current = true;
                onResult({ correct: true, near, transcript });
                return;
            }
            const nextAttempts = attempts + 1;
            if (nextAttempts >= MAX_ATTEMPTS) {
                reportedRef.current = true;
                onResult({ correct: false, near: false, transcript });
                return;
            }
            setAttempts(nextAttempts);
            setLastNear(near);
        },
        [targetWord, onResult, attempts],
    );

    const { supported, status, transcript, interimTranscript, start, stop, reset } =
        useSpeechRecognition({ onEnd: handleAttemptEnd, continuous: true });

    // No speech support at all: surface the typed fallback right away rather than
    // showing a mic the browser can never use.
    const unsupported = !supported;
    useEffect(() => {
        if (unsupported) onUseTextFallback();
    }, [unsupported, onUseTextFallback]);

    const isListening = status === "listening";
    const isDenied = status === "denied";

    // Press-and-hold: recording runs only while the button is held, so the
    // learner controls exactly when they're speaking (and it won't cut off on a
    // mid-word pause the way tap-to-start did). `holdingRef` guards the release
    // handlers so a stray pointerup/leave can't stop a recording we never began.
    const holdingRef = useRef(false);

    const beginHold = useCallback(() => {
        if (isListening || reportedRef.current || holdingRef.current) return;
        holdingRef.current = true;
        setNotHeard(false);
        // First press triggers the browser mic-permission prompt.
        start();
    }, [isListening, start]);

    const endHold = useCallback(() => {
        if (!holdingRef.current) return;
        holdingRef.current = false;
        stop();
    }, [stop]);

    const handleFallback = useCallback(() => {
        reset();
        onUseTextFallback();
    }, [reset, onUseTextFallback]);

    const attemptsLeft = MAX_ATTEMPTS - attempts;

    let statusLine: string;
    if (isDenied) {
        statusLine = "Microphone is blocked";
    } else if (isListening) {
        statusLine = "Listening… release when you're done";
    } else if (notHeard) {
        statusLine = "Didn't catch that — hold and try again";
    } else if (attempts > 0) {
        statusLine = lastNear ? "So close — try again" : "Not quite — try again";
    } else {
        statusLine = "Hold the mic and say the word";
    }

    return (
        <div className="space-y-5 text-center">
            <div>
                <AdaptiveText
                    text={word.meaning}
                    role="meaning"
                    align="center"
                    className="mb-2"
                />
                {word.partOfSpeech && <WordPill size="md">{word.partOfSpeech}</WordPill>}
            </div>

            <p className="text-sm text-muted-foreground" aria-live="polite">
                {statusLine}
            </p>

            {isDenied ? (
                <div className="mx-auto max-w-xs space-y-2 rounded-2xl border border-border bg-muted/30 p-4">
                    <MicOff className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden />
                    <p className="text-sm text-muted-foreground">
                        We can&apos;t hear you without microphone access. You can allow it
                        in your browser, or switch to a typed exercise.
                    </p>
                </div>
            ) : (
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
                    {isListening && !reduceMotion && (
                        <motion.span
                            aria-hidden
                            className="absolute inset-0 rounded-full bg-primary/25"
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 1.6, opacity: 0 }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                        />
                    )}
                    <Button
                        size="lg"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            // Capture the pointer so moving/leaving the button (or
                            // the mic-permission prompt stealing focus) can't fire a
                            // spurious pointerleave that ends the recording early.
                            try {
                                e.currentTarget.setPointerCapture(e.pointerId);
                            } catch {
                                // Older browsers without pointer capture — safe to skip.
                            }
                            beginHold();
                        }}
                        onPointerUp={endHold}
                        onPointerCancel={endHold}
                        onContextMenu={(e) => e.preventDefault()}
                        aria-label={isListening ? "Recording — release to stop" : "Hold to speak"}
                        className="relative h-16 w-16 touch-none select-none rounded-full gradient-brand text-white shadow-md sm:h-20 sm:w-20"
                    >
                        <Mic className="h-7 w-7 sm:h-8 sm:w-8" />
                    </Button>
                </div>
            )}

            {(interimTranscript || transcript) && !isDenied && (
                <div className="min-h-10 space-y-0.5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        You said
                    </p>
                    <p className="text-lg font-medium text-foreground/90">
                        {interimTranscript || transcript}
                    </p>
                </div>
            )}

            {!isDenied && attempts > 0 && (
                <p className="text-xs text-muted-foreground">
                    {attemptsLeft} {attemptsLeft === 1 ? "try" : "tries"} left
                </p>
            )}

            {/* The meaning is already shown above, so the reveal only adds the
                full example sentence — a stronger hint when the learner is stuck. */}
            <div>
                <WordRevealHint word={word} showMeaning={false} onReveal={onRevealHint} />
            </div>

            <button
                type="button"
                onClick={handleFallback}
                className="block mx-auto text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
                Can&apos;t use your mic? Switch to a text exercise for this session
            </button>
        </div>
    );
});
