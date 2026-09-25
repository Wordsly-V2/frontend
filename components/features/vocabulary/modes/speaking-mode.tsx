"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { WordPill } from "@/components/common/word-pill";
import { Button } from "@/components/ui/button";
import {
    type SpeechRecognitionErrorCode,
    useSpeechRecognition,
} from "@/hooks/useSpeechRecognition.hook";
import { isCorrectAnswer } from "@/lib/answer-quality";
import { hasShortcutModifier, isEditableKeyboardTarget } from "@/lib/keyboard-utils";
import { playAudioUrl } from "@/lib/practice-audio";
import { scoreSpeech, type SpeechScore } from "@/lib/speech-scoring";
import type { IWord } from "@/types/courses/courses.type";
import { Mic, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Tries before the best one is graded; a second try costs like a hint. */
export const SPEAKING_MAX_ATTEMPTS = 2;

/** Errors that trying again won't fix: the learner checks themselves instead. */
const BLOCKING_ERRORS = new Set<SpeechRecognitionErrorCode>(["not-allowed", "audio-capture", "network"]);

export interface SpeakingModeProps {
    word: IWord;
    /** The best score, once it passed or the tries ran out. */
    onResult: (score: SpeechScore, attempts: number) => void;
    /** No recognition after all (microphone refused, offline): self-check. */
    onSelfCheck: (saidItRight: boolean) => void;
}

/**
 * Speaking: read the meaning, say the word or phrase. The recogniser's
 * alternatives are scored with `scoreSpeech`; a miss gets one more try before
 * the better attempt is graded, so a recogniser slip isn't an instant fail.
 * Space starts and stops the mic.
 */
export function SpeakingMode({ word, onResult, onSelfCheck }: Readonly<SpeakingModeProps>) {
    const recognition = useSpeechRecognition();
    const [handled, setHandled] = useState<string[] | null>(null);
    const [best, setBest] = useState<SpeechScore | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [toGrade, setToGrade] = useState<{ score: SpeechScore; attempts: number } | null>(null);

    // Score each new result once (during render, not in an effect).
    const { transcripts } = recognition;
    if (transcripts && transcripts !== handled) {
        const score = scoreSpeech(word.word, transcripts);
        setHandled(transcripts);
        if (score) {
            const tries = attempts + 1;
            const better = best && best.accuracy >= score.accuracy ? best : score;
            setAttempts(tries);
            setBest(better);
            if (isCorrectAnswer(better.quality) || tries >= SPEAKING_MAX_ATTEMPTS) {
                setToGrade({ score: better, attempts: tries });
            }
        }
    }

    // Hand the grade up once, after render; the engine moves to its result panel.
    const sentRef = useRef(false);
    useEffect(() => {
        if (!toGrade || sentRef.current) return;
        sentRef.current = true;
        onResult(toGrade.score, toGrade.attempts);
    }, [toGrade, onResult]);

    const blocked = recognition.error !== null && BLOCKING_ERRORS.has(recognition.error);
    const canRecognise = recognition.supported && !blocked;
    const { listening, start, stop } = recognition;

    useEffect(() => {
        if (!canRecognise) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== " " || e.repeat || hasShortcutModifier(e) || isEditableKeyboardTarget(e.target)) return;
            e.preventDefault();
            if (listening) stop();
            else start();
        };
        globalThis.addEventListener("keydown", onKeyDown);
        return () => globalThis.removeEventListener("keydown", onKeyDown);
    }, [canRecognise, listening, start, stop]);

    return (
        <div className="space-y-5 text-center">
            <AdaptiveText text={word.meaning} role="meaning" align="center" className="mb-2" />
            {word.partOfSpeech && <WordPill size="md">{word.partOfSpeech}</WordPill>}

            {canRecognise ? (
                <>
                    <p className="text-sm text-muted-foreground">
                        {attempts === 0 ? "Say it in English" : "Not quite. Try once more"}
                    </p>
                    <Button
                        size="lg"
                        onClick={listening ? stop : start}
                        aria-pressed={listening}
                        aria-label={listening ? "Stop listening" : "Start speaking"}
                        className="h-16 w-16 rounded-full gradient-brand text-white shadow-md sm:h-20 sm:w-20"
                    >
                        {listening ? (
                            <Square className="h-7 w-7 fill-current sm:h-8 sm:w-8" />
                        ) : (
                            <Mic className="h-7 w-7 sm:h-8 sm:w-8" />
                        )}
                    </Button>
                    <div role="status" aria-live="polite" className="min-h-6 text-sm">
                        {listening && <p className="italic text-muted-foreground">{recognition.interim || "Listening…"}</p>}
                        {!listening && recognition.error === "no-speech" && (
                            <p className="text-muted-foreground">We didn&apos;t hear anything. Tap the mic and try again.</p>
                        )}
                        {!listening && best && !toGrade && (
                            <p className="text-muted-foreground">We heard: &ldquo;{best.heard}&rdquo;</p>
                        )}
                    </div>
                </>
            ) : (
                <SelfCheck
                    word={word}
                    reason={recognition.error}
                    revealed={revealed}
                    onReveal={() => {
                        setRevealed(true);
                        if (word.audioUrl) playAudioUrl(word.audioUrl);
                    }}
                    onSelfCheck={onSelfCheck}
                />
            )}
        </div>
    );
}

function SelfCheck({
    word,
    reason,
    revealed,
    onReveal,
    onSelfCheck,
}: Readonly<{
    word: IWord;
    reason: SpeechRecognitionErrorCode | null;
    revealed: boolean;
    onReveal: () => void;
    onSelfCheck: (saidItRight: boolean) => void;
}>) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                {reason === "not-allowed" ? "The microphone is off. " : ""}
                Say it out loud, then check.
            </p>
            {revealed ? (
                <>
                    <div className="flex items-center justify-center gap-2">
                        <p className="font-display text-2xl font-bold">{word.word}</p>
                        {word.audioUrl && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => playAudioUrl(word.audioUrl)}
                                aria-label={`Listen: ${word.word}`}
                                className="rounded-full"
                            >
                                <Volume2 aria-hidden />
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button onClick={() => onSelfCheck(true)} className="rounded-xl">
                            I said it right
                        </Button>
                        <Button variant="outline" onClick={() => onSelfCheck(false)} className="rounded-xl">
                            I got it wrong
                        </Button>
                    </div>
                </>
            ) : (
                <Button variant="outline" onClick={onReveal} className="rounded-xl">
                    Show the answer
                </Button>
            )}
        </div>
    );
}
