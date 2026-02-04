"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle } from "lucide-react";

interface TypingResultDialogProps {
    isOpen: boolean;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    pronunciation?: string;
    onTryAgain: () => void;
    onNext: () => void;
    isLastWord: boolean;
}

export default function TypingResultDialog({
    isOpen,
    isCorrect,
    userAnswer,
    correctAnswer,
    pronunciation,
    onTryAgain,
    onNext,
    isLastWord,
}: Readonly<TypingResultDialogProps>) {
    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="max-w-md" showCloseButton={false}>
                <div className="text-center py-6">
                    {isCorrect ? (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-in zoom-in duration-500">
                                <CheckCircle2 className="h-11 w-11 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-green-600">Perfect!</h3>
                            <div className="inline-block px-6 py-3 rounded-xl bg-green-50 border-2 border-green-200">
                                <p className="text-lg font-semibold text-green-900">
                                    {correctAnswer}
                                </p>
                                {pronunciation && (
                                    <p className="text-sm text-green-700 mt-1">
                                        /{pronunciation}/
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-rose-500 animate-in zoom-in duration-500">
                                <XCircle className="h-11 w-11 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-red-600">Not Quite</h3>
                            <div className="space-y-3">
                                {userAnswer && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Your answer:</p>
                                        <div className="inline-block px-4 py-2 rounded-lg bg-muted border border-border">
                                            <p className="text-sm font-medium text-muted-foreground line-through">
                                                {userAnswer}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Correct answer:</p>
                                    <div className="inline-block px-6 py-3 rounded-xl bg-red-50 border-2 border-red-200">
                                        <p className="text-lg font-bold text-red-900">{correctAnswer}</p>
                                        {pronunciation && (
                                            <p className="text-sm text-red-700 mt-1">
                                                /{pronunciation}/
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
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
