"use client";

import { useState, useEffect, useRef } from "react";
import { IWord } from "@/types/courses/courses.type";
import { Button } from "@/components/ui/button";
import { Volume2, ChevronRight, CheckCircle2, XCircle, Sparkles, Keyboard } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface VocabularyPracticeProps {
    words: IWord[];
    onComplete?: (score: number) => void;
}

type PracticeMode = "flashcard" | "typing";

export default function VocabularyPractice({
    words,
    onComplete,
}: Readonly<VocabularyPracticeProps>) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState("");
    const [correctCount, setCorrectCount] = useState(0);
    const [mode, setMode] = useState<PracticeMode>("flashcard");
    const [autoCheck, setAutoCheck] = useState(true);
    const [typingResult, setTypingResult] = useState<"correct" | "incorrect" | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentWord = words[currentIndex];
    const progress = ((currentIndex + 1) / words.length) * 100;

    const normalize = (value: string) =>
        value.trim().toLowerCase().replaceAll(/\s+/g, " ");

    const score = Math.round((correctCount / words.length) * 100);
    const isFlashcard = mode === "flashcard";
    const isTyping = mode === "typing";

    useEffect(() => {
        if (isTyping && !typingResult && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isTyping, typingResult, currentIndex]);

    const handleNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
            setUserAnswer("");
            setTypingResult(null);
        } else {
            onComplete?.(score);
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

    const handleCheckTypingAnswer = () => {
        if (!currentWord) {
            return;
        }
        const isCorrect = normalize(userAnswer) === normalize(currentWord.word);
        if (isCorrect) {
            if (typingResult !== "correct") {
                setCorrectCount((prev) => prev + 1);
            }
            setTypingResult("correct");
        } else {
            setTypingResult("incorrect");
        }
    };

    useEffect(() => {
        if (mode !== "typing" || !autoCheck || typingResult || !currentWord) {
            return;
        }
        
        const checkAnswer = () => {
            if (normalize(userAnswer) === normalize(currentWord.word)) {
                setTypingResult("correct");
                setCorrectCount((prev) => prev + 1);
            }
        };
        
        checkAnswer();
    }, [autoCheck, currentWord, mode, typingResult, userAnswer]);

    useEffect(() => {
        const resetState = () => {
            setShowAnswer(false);
            setUserAnswer("");
            setTypingResult(null);
        };
        
        resetState();
    }, [mode]);

    const renderCompletion = () => (
        <div className="text-center py-16 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-6 animate-in zoom-in duration-700">
                <CheckCircle2 className="h-14 w-14 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3 gradient-brand bg-clip-text text-transparent">
                Excellent Work!
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
                You&apos;ve completed all <span className="font-semibold text-foreground">{words.length}</span> words
            </p>
            <div className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-primary/10 border-2 border-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
                <p className="text-4xl font-bold text-primary">
                    {score}%
                </p>
            </div>
        </div>
    );

    const renderModeSwitch = () => (
        <div className="mb-8">
            <div className="flex justify-center gap-3 mb-6">
                <Button
                    size="lg"
                    variant={isFlashcard ? "default" : "outline"}
                    onClick={() => setMode("flashcard")}
                    className="gap-2 px-6 rounded-xl transition-all hover:scale-105"
                >
                    <Sparkles className="h-4 w-4" />
                    Flashcard Mode
                </Button>
                <Button
                    size="lg"
                    variant={isTyping ? "default" : "outline"}
                    onClick={() => setMode("typing")}
                    className="gap-2 px-6 rounded-xl transition-all hover:scale-105"
                >
                    <Keyboard className="h-4 w-4" />
                    Typing Mode
                </Button>
            </div>
            {isTyping && (
                <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                    <Switch
                        id="auto-check"
                        checked={autoCheck}
                        onCheckedChange={setAutoCheck}
                        className="data-[state=checked]:bg-green-500"
                    />
                    <Label htmlFor="auto-check" className="cursor-pointer text-sm font-medium">
                        Auto-check enabled
                    </Label>
                    <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                        Correct answers auto-validate as you type
                    </span>
                </div>
            )}
        </div>
    );

    const renderFlashcardCard = () => (
        <>
            <div className="space-y-8">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <h2 className="text-5xl font-bold tracking-tight">{currentWord.word}</h2>
                        {currentWord.audioUrl && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePlayAudio}
                                className="h-12 w-12 rounded-xl hover:scale-110 transition-transform"
                            >
                                <Volume2 className="h-6 w-6" />
                            </Button>
                        )}
                    </div>
                    {currentWord.pronunciation && (
                        <p className="text-muted-foreground text-xl font-light mb-3">
                            /{currentWord.pronunciation}/
                        </p>
                    )}
                    {currentWord.partOfSpeech && (
                        <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-sm font-semibold border border-primary/20">
                            {currentWord.partOfSpeech}
                        </span>
                    )}
                </div>

                {showAnswer && (
                    <div className="text-center pt-8 border-t-2 border-dashed border-border animate-in fade-in slide-in-from-bottom-6 duration-500">
                        <p className="text-3xl font-semibold text-foreground">{currentWord.meaning}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-center mt-10">
                {showAnswer ? (
                    <Button
                        onClick={handleNext}
                        size="lg"
                        className="min-w-[240px] h-14 text-lg rounded-xl gap-2 hover:scale-105 transition-transform"
                    >
                        {currentIndex < words.length - 1 ? (
                            <>
                                Next Word
                                <ChevronRight className="h-5 w-5" />
                            </>
                        ) : (
                            "Finish Practice"
                        )}
                    </Button>
                ) : (
                    <Button 
                        onClick={handleReveal} 
                        size="lg" 
                        className="min-w-[240px] h-14 text-lg rounded-xl hover:scale-105 transition-transform"
                    >
                        Reveal Meaning
                    </Button>
                )}
            </div>
        </>
    );

    const renderTypingCard = () => (
        <>
            <div className="space-y-8">
                <div className="text-center">
                    <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-4 flex items-center justify-center gap-2">
                        <span className="h-px w-8 bg-border"></span>
                        Translation
                        <span className="h-px w-8 bg-border"></span>
                    </p>
                    <p className="text-3xl font-bold mb-4">{currentWord.meaning}</p>
                    {currentWord.partOfSpeech && (
                        <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-sm font-semibold border border-primary/20">
                            {currentWord.partOfSpeech}
                        </span>
                    )}
                </div>

                {typingResult ? (
                    <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                        {typingResult === "correct" ? (
                            <div className="space-y-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-in zoom-in duration-500">
                                    <CheckCircle2 className="h-11 w-11 text-white" />
                                </div>
                                <p className="text-2xl font-bold text-green-600">Perfect!</p>
                                <div className="inline-block px-6 py-3 rounded-xl bg-green-50 border-2 border-green-200">
                                    <p className="text-lg font-semibold text-green-900">
                                        {currentWord.word}
                                    </p>
                                    {currentWord.pronunciation && (
                                        <p className="text-sm text-green-700 mt-1">
                                            /{currentWord.pronunciation}/
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-rose-500 animate-in zoom-in duration-500">
                                    <XCircle className="h-11 w-11 text-white" />
                                </div>
                                <p className="text-2xl font-bold text-red-600">Not Quite</p>
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Correct answer:</p>
                                    <div className="inline-block px-6 py-3 rounded-xl bg-red-50 border-2 border-red-200">
                                        <p className="text-lg font-bold text-red-900">{currentWord.word}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type your answer..."
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key !== "Enter") {
                                        return;
                                    }
                                    if (autoCheck) {
                                        return;
                                    }
                                    handleCheckTypingAnswer();
                                }}
                                disabled={typingResult === "correct"}
                                className="w-full px-6 py-5 text-2xl font-medium text-center rounded-2xl border-2 border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground/40"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-purple/5 -z-10 blur-xl opacity-0 transition-opacity group-focus-within:opacity-100"></div>
                        </div>
                        {!autoCheck && (
                            <div className="flex justify-center">
                                <Button
                                    size="lg"
                                    className="min-w-[240px] h-14 text-lg rounded-xl gap-2 hover:scale-105 transition-transform"
                                    onClick={handleCheckTypingAnswer}
                                    disabled={userAnswer.trim().length === 0}
                                >
                                    <CheckCircle2 className="h-5 w-5" />
                                    Check Answer
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {typingResult && (
                <div className="flex flex-wrap justify-center gap-3 mt-10">
                    {typingResult === "incorrect" && (
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => {
                                setTypingResult(null);
                                setUserAnswer("");
                                setTimeout(() => inputRef.current?.focus(), 100);
                            }}
                            className="rounded-xl hover:scale-105 transition-transform"
                        >
                            Try Again
                        </Button>
                    )}
                    <Button 
                        onClick={handleNext} 
                        size="lg" 
                        className="min-w-[240px] h-14 text-lg rounded-xl gap-2 hover:scale-105 transition-transform"
                    >
                        {currentIndex < words.length - 1 ? (
                            <>
                                Next Word
                                <ChevronRight className="h-5 w-5" />
                            </>
                        ) : (
                            "Finish Practice"
                        )}
                    </Button>
                </div>
            )}
        </>
    );

    if (!currentWord) {
        return renderCompletion();
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-10">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-3">
                    <span>Your Progress</span>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {currentIndex + 1} of {words.length}
                    </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            </div>

            {renderModeSwitch()}

            {/* Practice Card */}
            <div className="bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-3xl p-10 mb-8 min-h-[420px] flex flex-col justify-between shadow-xl shadow-primary/5 backdrop-blur-sm">
                {isFlashcard ? renderFlashcardCard() : renderTypingCard()}
            </div>

            {/* Quick Actions - Only for Flashcard Mode */}
            {isFlashcard && showAnswer && (
                <div className="flex flex-wrap gap-3 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            setCorrectCount(correctCount + 1);
                            handleNext();
                        }}
                        className="gap-2 rounded-xl border-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:scale-105 transition-all"
                    >
                        <CheckCircle2 className="h-5 w-5" />
                        I Know This
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleNext}
                        className="gap-2 rounded-xl border-2 text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:scale-105 transition-all"
                    >
                        <XCircle className="h-5 w-5" />
                        Still Learning
                    </Button>
                </div>
            )}
        </div>
    );
}
