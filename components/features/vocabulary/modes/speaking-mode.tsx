"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { WordPill } from "@/components/common/word-pill";
import { WordPracticeHints } from "@/components/features/vocabulary/word-practice-hints";
import { Button } from "@/components/ui/button";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition.hook";
import { getAnswerMatch, type AnswerMatch } from "@/lib/practice-utils";
import { IWord } from "@/types/courses/courses.type";
import { Mic, MicOff } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { memo, useCallback, useRef, useState } from "react";

/** Total tries before the word is marked incorrect (1 attempt + 2 retries). */
const MAX_ATTEMPTS = 3;

/** Say-the-word mode: show the meaning/image, speak the word, grade the speech. */
export interface SpeakingModeProps {
    word: IWord;
    /** Word to grade the spoken answer against (matches the typed-answer path). */
    targetWord: string;
    maskedExamples: string[];
    showImageHints: boolean;
    /** Report the single, final graded outcome (after any retries). */
    onResult: (result: { correct: boolean; near: boolean; transcript: string }) => void;
    /** Escape hatch to a typed exercise — same name/role as the listening mode. */
    onUseTextFallback: () => void;
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

/** Best match across the final transcript and all its alternatives. */
function gradeSpoken(candidates: string[], target: string): AnswerMatch {
    let best: AnswerMatch = "wrong";
    for (const candidate of candidates) {
        const match = getAnswerMatch(candidate, target);
        if (match === "exact") return "exact";
        if (match === "near") best = "near";
    }
    return best;
}

export const SpeakingMode = memo(function SpeakingMode({
    word,
    targetWord,
    maskedExamples,
    showImageHints,
    onResult,
    onUseTextFallback,
}: Readonly<SpeakingModeProps>) {
    const reduceMotion = useReducedMotion();

    const [attempts, setAttempts] = useState(0);
    const [lastNear, setLastNear] = useState(false);
    const reportedRef = useRef(false);

    // Grade when an attempt ends (fired from the recognizer's `onend`, so this is
    // an event callback — not a status effect). Reports the final outcome only —
    // never per attempt — so the engine's worst-attempt merge stays consistent.
    const handleAttemptEnd = useCallback(
        ({ transcript, alternatives }: { transcript: string; alternatives: string[] }) => {
            if (reportedRef.current) return;
            const candidates = collectCandidates(alternatives, transcript);
            const match = gradeSpoken(candidates, targetWord);
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

    const { supported, status, transcript, interimTranscript, start, reset } =
        useSpeechRecognition({ onEnd: handleAttemptEnd });

    const isListening = status === "listening";
    const isDenied = status === "denied";

    const handleMicTap = useCallback(() => {
        if (isListening || reportedRef.current) return;
        // First tap triggers the browser mic-permission prompt.
        start();
    }, [isListening, start]);

    const handleFallback = useCallback(() => {
        reset();
        onUseTextFallback();
    }, [reset, onUseTextFallback]);

    const attemptsLeft = MAX_ATTEMPTS - attempts;

    let statusLine: string;
    if (isDenied) {
        statusLine = "Microphone is blocked";
    } else if (isListening) {
        statusLine = "Listening… say the word";
    } else if (attempts > 0) {
        statusLine = lastNear ? "So close — try again" : "Not quite — try again";
    } else {
        statusLine = "Say the word";
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
                <WordPracticeHints
                    maskedExamples={maskedExamples}
                    imageUrl={word.imageUrl}
                    showImageHints={showImageHints}
                />
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
                        onClick={handleMicTap}
                        disabled={isListening}
                        aria-label={isListening ? "Listening" : "Tap to speak"}
                        className="relative h-16 w-16 rounded-full gradient-brand text-white shadow-md sm:h-20 sm:w-20"
                    >
                        <Mic className="h-7 w-7 sm:h-8 sm:w-8" />
                    </Button>
                </div>
            )}

            {(interimTranscript || transcript) && !isDenied && (
                <p className="min-h-6 text-lg font-medium text-foreground/90">
                    {interimTranscript || transcript}
                </p>
            )}

            {!isDenied && attempts > 0 && (
                <p className="text-xs text-muted-foreground">
                    {attemptsLeft} {attemptsLeft === 1 ? "try" : "tries"} left
                </p>
            )}

            <button
                type="button"
                onClick={handleFallback}
                className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
                {supported
                    ? "Can't use your mic? Switch to a text exercise for this session"
                    : "Speaking isn't supported here — switch to a text exercise"}
            </button>
        </div>
    );
});
