"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Volume2, Timer } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

export interface PracticeResultDialogProps {
    isOpen: boolean;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    meaning: string;
    pronunciation?: string;
    partOfSpeech?: string;
    audioUrl?: string;
    imageUrl?: string;
    examples?: string[];
    timeSpentSeconds?: number;
    onTryAgain: () => void;
    onNext: () => void;
    isLastWord: boolean;
}

export default function PracticeResultDialog({
    isOpen,
    isCorrect,
    userAnswer,
    correctAnswer,
    meaning,
    pronunciation,
    partOfSpeech,
    audioUrl,
    imageUrl,
    examples = [],
    timeSpentSeconds,
    onTryAgain,
    onNext,
    isLastWord,
}: Readonly<PracticeResultDialogProps>) {
    // Auto-play audio when dialog opens
    useEffect(() => {
        if (isOpen && audioUrl) {
            const timer = setTimeout(() => {
                const audio = new Audio(audioUrl);
                audio.play().catch(console.error);
            }, 300); // Small delay for better UX

            return () => clearTimeout(timer);
        }
    }, [isOpen, audioUrl]);

    // Handle Enter key to proceed to next word
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                onNext();
            }
        };

        globalThis.addEventListener("keydown", handleKeyDown);
        return () => globalThis.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onNext]);

    const handlePlayAudio = () => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play().catch(console.error);
        }
    };

    let speedLabel: string | null = null;
    if (timeSpentSeconds != null && timeSpentSeconds > 0) {
        speedLabel = timeSpentSeconds < 60
            ? `${Math.round(timeSpentSeconds)} sec per word`
            : `${(60 / timeSpentSeconds).toFixed(1)} words/min`;
    }

    const isCorrectTheme = isCorrect;

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="max-w-md max-h-[min(90dvh,820px)] overflow-hidden flex flex-col p-4 sm:p-5 gap-0"
                showCloseButton={false}
            >
                <DialogTitle className="sr-only">
                    {isCorrect ? "Correct Answer" : "Incorrect Answer"}
                </DialogTitle>

                <div className="flex flex-col min-h-0 flex-1 overflow-hidden text-center">
                    {speedLabel && (
                        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-muted-foreground mb-2 shrink-0">
                            <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>{speedLabel}</span>
                        </div>
                    )}

                    {isCorrect ? (
                        <div className="space-y-2 sm:space-y-3 animate-in fade-in zoom-in duration-500 shrink-0">
                            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
                                <CheckCircle2 className="h-8 w-8 sm:h-9 sm:w-9 text-white" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-green-600">Perfect!</h3>
                        </div>
                    ) : (
                        <div className="space-y-2 sm:space-y-3 animate-in fade-in zoom-in duration-500 shrink-0">
                            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-400 to-rose-500">
                                <XCircle className="h-8 w-8 sm:h-9 sm:w-9 text-white" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-red-600">Not Quite</h3>
                            {userAnswer && (
                                <div className="flex justify-center">
                                    <div className="inline-block px-3 py-1.5 rounded-lg bg-muted border border-border">
                                        <p className="text-xs sm:text-sm font-medium text-muted-foreground line-through">
                                            Your answer: {userAnswer}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Word card: image + details + examples — single compact block, no scroll */}
                    <div
                        className={
                            isCorrectTheme
                                ? "mt-2 sm:mt-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-green-50 border-2 border-green-200 text-left min-h-0 flex flex-col"
                                : "mt-2 sm:mt-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-red-50 border-2 border-red-200 text-left min-h-0 flex flex-col"
                        }
                    >
                        <div className="flex gap-3 sm:gap-4 items-start min-h-0">
                            {imageUrl && (
                                <div className="shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-muted border border-border">
                                    <Image
                                        src={imageUrl}
                                        alt=""
                                        width={144}
                                        height={144}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className={`text-base sm:text-lg font-semibold ${isCorrectTheme ? "text-green-900" : "text-red-900"}`}>
                                            {correctAnswer}
                                        </p>
                                <p className={`text-sm mt-1 ${isCorrectTheme ? "text-green-700" : "text-red-700"} line-clamp-2`} title={meaning}>
                                    {meaning}
                                </p>
                                        {(partOfSpeech || pronunciation) && (
                                            <p className={`text-xs mt-0.5 ${isCorrectTheme ? "text-green-600" : "text-red-600"}`}>
                                                {[partOfSpeech, pronunciation].filter(Boolean).join(" · ")}
                                            </p>
                                        )}
                                    </div>
                                    {audioUrl && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={handlePlayAudio}
                                            className={`h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full ${isCorrectTheme ? "hover:bg-green-100 text-green-700" : "hover:bg-red-100 text-red-700"}`}
                                        >
                                            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {examples.length > 0 && (
                            <div className={`mt-2 pt-2 border-t ${isCorrectTheme ? "border-green-200/60" : "border-red-200/60"} min-h-0 flex flex-col`}>
                                <p className={`text-xs font-medium mb-1 shrink-0 ${isCorrectTheme ? "text-green-800" : "text-red-800"}`}>Examples</p>
                                <ul className="space-y-1 overflow-y-auto max-h-[min(100px,20dvh)] pr-1">
                                    {examples.map((ex) => (
                                        <li key={ex} className={`text-xs sm:text-sm ${isCorrectTheme ? "text-green-700" : "text-red-700"}`}>
                                            &ldquo;{ex}&rdquo;
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 mt-3 sm:mt-4 shrink-0 pt-2 border-t">
                    {!isCorrect && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onTryAgain}
                            className="flex-1"
                        >
                            Try Again
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={onNext}
                        className="flex-1"
                    >
                        {isLastWord ? "Finish Practice" : "Next Word"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
