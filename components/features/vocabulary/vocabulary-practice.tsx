"use client";

import { useState, useEffect } from "react";
import { IWord } from "@/types/courses/courses.type";
import { Button } from "@/components/ui/button";
import { Volume2, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface VocabularyPracticeProps {
    words: IWord[];
    onComplete?: (score: number) => void;
}

type PracticeMode = "flashcard" | "typing" | "multiple-choice";

export default function VocabularyPractice({
    words,
    onComplete,
}: Readonly<VocabularyPracticeProps>) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState("");
    const [correctCount, setCorrectCount] = useState(0);
    const [mode] = useState<PracticeMode>("flashcard");

    const currentWord = words[currentIndex];
    const progress = ((currentIndex + 1) / words.length) * 100;

    const handleNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
            setUserAnswer("");
        } else {
            onComplete?.(Math.round((correctCount / words.length) * 100));
        }
    };

    const handleReveal = () => {
        setShowAnswer(true);
    };

    const handlePlayAudio = () => {
        if (currentWord.audioUrl) {
            const audio = new Audio(currentWord.audioUrl);
            audio.play().catch(console.error);
        }
    };

    if (!currentWord) {
        return (
            <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Great job!</h2>
                <p className="text-muted-foreground mb-6">
                    You've completed all {words.length} words
                </p>
                <p className="text-3xl font-bold text-primary">
                    Score: {Math.round((correctCount / words.length) * 100)}%
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>Progress</span>
                    <span>
                        {currentIndex + 1} / {words.length}
                    </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Flashcard */}
            <div className="bg-card border-2 border-border rounded-2xl p-8 mb-6 min-h-[300px] flex flex-col justify-between">
                <div>
                    {/* Word */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <h2 className="text-4xl font-bold">{currentWord.word}</h2>
                            {currentWord.audioUrl && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handlePlayAudio}
                                    className="h-10 w-10"
                                >
                                    <Volume2 className="h-6 w-6" />
                                </Button>
                            )}
                        </div>
                        {currentWord.pronunciation && (
                            <p className="text-muted-foreground text-lg">
                                /{currentWord.pronunciation}/
                            </p>
                        )}
                        {currentWord.partOfSpeech && (
                            <span className="inline-block mt-3 text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                {currentWord.partOfSpeech}
                            </span>
                        )}
                    </div>

                    {/* Answer */}
                    {showAnswer && (
                        <div className="text-center pt-6 border-t border-border animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <p className="text-2xl font-medium">{currentWord.meaning}</p>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <div className="flex justify-center mt-8">
                    {!showAnswer ? (
                        <Button onClick={handleReveal} size="lg" className="min-w-[200px]">
                            Show Meaning
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            size="lg"
                            className="min-w-[200px]"
                        >
                            {currentIndex < words.length - 1 ? (
                                <>
                                    Next Word
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </>
                            ) : (
                                "Finish"
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            {showAnswer && (
                <div className="flex gap-3 justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setCorrectCount(correctCount + 1);
                            handleNext();
                        }}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        I know this
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Still learning
                    </Button>
                </div>
            )}
        </div>
    );
}
