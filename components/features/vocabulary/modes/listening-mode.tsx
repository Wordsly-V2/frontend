"use client";

import { Button } from "@/components/ui/button";
import { Play, Volume2 } from "lucide-react";
import { memo, type KeyboardEvent, type RefObject } from "react";

/** Dictation: play the audio and type what you heard. */
export interface ListeningModeProps {
    audioUrl?: string;
    hasPlayedAudio: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    inputClassName: string;
    userAnswer: string;
    onAnswerChange: (value: string) => void;
    onSubmitEnter: (e: KeyboardEvent<HTMLInputElement>) => void;
    /** Big play button — marks the audio as played (enables answering). */
    onPlay: () => void;
    /** Secondary "Replay" — just replays, without changing played state. */
    onReplay: () => void;
    onHint: () => void;
    autoCheck: boolean;
    onCheck: () => void;
    onUseTextFallback: () => void;
}

export const ListeningMode = memo(function ListeningMode({
    audioUrl,
    hasPlayedAudio,
    inputRef,
    inputClassName,
    userAnswer,
    onAnswerChange,
    onSubmitEnter,
    onPlay,
    onReplay,
    onHint,
    autoCheck,
    onCheck,
    onUseTextFallback,
}: Readonly<ListeningModeProps>) {
    return (
        <div className="space-y-5 text-center">
            <p className="text-sm text-muted-foreground">
                {hasPlayedAudio ? "Type what you heard" : "Playing audio…"}
            </p>
            <Button
                size="lg"
                onClick={onPlay}
                disabled={!audioUrl}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full gradient-brand text-white shadow-md"
                aria-label="Replay audio"
            >
                {audioUrl ? (
                    <Volume2 className="h-7 w-7 sm:h-8 sm:w-8" />
                ) : (
                    <Play className="h-7 w-7 sm:h-8 sm:w-8" />
                )}
            </Button>
            <input
                ref={inputRef}
                type="text"
                autoFocus
                placeholder="Type what you heard…"
                value={userAnswer}
                onChange={(e) => onAnswerChange(e.target.value)}
                onKeyDown={onSubmitEnter}
                className={inputClassName}
            />
            <div className="flex justify-center gap-2 flex-wrap">
                <Button variant="outline" onClick={onReplay} className="rounded-xl">
                    Replay
                </Button>
                <Button
                    variant="outline"
                    onClick={onHint}
                    disabled={!hasPlayedAudio}
                    className="rounded-xl"
                >
                    Hint
                </Button>
                {!autoCheck && (
                    <Button
                        onClick={onCheck}
                        disabled={!userAnswer.trim() || !hasPlayedAudio}
                        className="rounded-xl"
                    >
                        Check
                    </Button>
                )}
            </div>
            <button
                type="button"
                onClick={onUseTextFallback}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
                Can&apos;t hear the audio? Switch to a text exercise for this session
            </button>
        </div>
    );
});
