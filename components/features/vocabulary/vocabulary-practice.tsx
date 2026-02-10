"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { IWord } from "@/types/courses/courses.type";
import { Button } from "@/components/ui/button";
import { Volume2, ChevronRight, CheckCircle2, XCircle, Settings2, Sparkles, Lightbulb, List, Play } from "lucide-react";
import PracticeSettingsDialog, { PracticeMode, PracticeSettings } from "@/components/features/vocabulary/practice-settings-dialog";
import PracticeResultDialog from "@/components/features/vocabulary/practice-result-dialog";
import WordsSummaryDialog from "@/components/features/vocabulary/words-summary-dialog";
import { AnswerQuality } from "@/types/word-progress/word-progress.type";

export interface WordResult {
    wordId: string;
    quality: AnswerQuality;
}

interface VocabularyPracticeProps {
    words: IWord[];
    onWordComplete?: (result: WordResult) => void;
    onComplete?: (score: number, wordResults: WordResult[]) => void;
}

const SETTINGS_STORAGE_KEY = "vocabulary-practice-settings";

// Helper function to shuffle array
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Helper function to load settings from localStorage
const loadSettings = (): PracticeSettings => {
    try {
        const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
    } catch (error) {
        console.error("Failed to load practice settings:", error);
    }
    return { mode: "flashcard", autoCheck: true };
};

export default function VocabularyPractice({
    words,
    onWordComplete,
    onComplete,
}: Readonly<VocabularyPracticeProps>) {
    const [shuffledWords] = useState(() => shuffleArray(words));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState("");
    const [correctCount, setCorrectCount] = useState(0);
    const [mode, setMode] = useState<PracticeMode>(() => loadSettings().mode);
    const [autoCheck, setAutoCheck] = useState(() => loadSettings().autoCheck);
    const [typingResult, setTypingResult] = useState<"correct" | "incorrect" | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
    const [wordResults, setWordResults] = useState<WordResult[]>([]);
    const [timeSpentSeconds, setTimeSpentSeconds] = useState<number | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);
    const wordStartTimeRef = useRef<number | null>(null);

    const addWordResult = useCallback(
        (result: WordResult) => {
            setWordResults((prev) => [...prev, result]);
            onWordComplete?.(result);
        },
        [onWordComplete]
    );

    const currentWord = shuffledWords[currentIndex];
    const progress = ((currentIndex + 1) / shuffledWords.length) * 100;

    const normalize = (value: string) =>
        value.trim().toLowerCase().replaceAll(/\s+/g, " ");

    // Helper function to calculate answer quality based on correctness and hints
    const calculateAnswerQuality = (isCorrect: boolean, hintsUsed: number = 0): AnswerQuality => {
        if (!isCorrect) {
            return AnswerQuality.INCORRECT;
        }

        if (hintsUsed === 0) {
            return AnswerQuality.PERFECT;
        } else if (hintsUsed === 1) {
            return AnswerQuality.CORRECT_WITH_HESITATION;
        } else {
            return AnswerQuality.CORRECT_WITH_DIFFICULTY;
        }
    };

    const score = Math.round((correctCount / shuffledWords.length) * 100);
    const isFlashcard = mode === "flashcard";
    const isTyping = mode === "typing";
    const isMultipleChoice = mode === "multiple-choice";
    const isListening = mode === "listening";
    const isLastWord = currentIndex === shuffledWords.length - 1;

    // Get current settings
    const currentSettings: PracticeSettings = {
        mode,
        autoCheck,
    };

    // Generate multiple choice options
    const generateMultipleChoiceOptions = (correctWord: IWord, allWords: IWord[]): string[] => {
        const options = [correctWord.meaning];
        const otherWords = allWords.filter(w => w.id !== correctWord.id);
        const shuffledOthers = shuffleArray(otherWords);

        // Add 3 random incorrect options
        for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
            options.push(shuffledOthers[i].meaning);
        }

        return shuffleArray(options);
    };

    // Memoize multiple choice options to avoid regenerating on every render
    const multipleChoiceOptions = useMemo(() => {
        if (isMultipleChoice && currentWord) {
            return generateMultipleChoiceOptions(currentWord, shuffledWords);
        }
        return [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, isMultipleChoice]);

    // Calculate next hint
    const getNextHint = (): string => {
        const correctWord = normalize(currentWord.word);
        const currentInput = normalize(userAnswer);

        // Find the longest correct prefix
        let correctPrefixLength = 0;
        for (let i = 0; i < Math.min(currentInput.length, correctWord.length); i++) {
            if (currentInput[i] === correctWord[i]) {
                correctPrefixLength = i + 1;
            } else {
                break;
            }
        }

        // Return hint up to the next correct letter
        if (correctPrefixLength < correctWord.length) {
            return correctWord.substring(0, correctPrefixLength + 1);
        }

        return correctWord;
    };

    const handleGetHint = () => {
        const hint = getNextHint();
        setUserAnswer(hint);
        setHintsUsed(hintsUsed + 1);
        // Position cursor at the end of the hint
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const length = hint.length;
                inputRef.current.setSelectionRange(length, length);
            }
        }, 0);
    };

    // Handle settings save
    const handleSaveSettings = (newSettings: PracticeSettings) => {
        setMode(newSettings.mode);
        setAutoCheck(newSettings.autoCheck);

        // Save to localStorage
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error("Failed to save practice settings:", error);
        }
    };

    // Start per-word timer when showing a new word (typing, multiple-choice, listening)
    useEffect(() => {
        if (isTyping || isMultipleChoice || isListening) {
            wordStartTimeRef.current = Date.now();
        }
    }, [currentIndex, isTyping, isMultipleChoice, isListening]);

    useEffect(() => {
        if ((isTyping || isListening) && !typingResult && inputRef.current) {
            inputRef.current.focus();

            // Scroll input into view when keyboard appears on mobile
            const handleFocus = () => {
                setTimeout(() => {
                    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300); // Wait for keyboard to appear
            };

            inputRef.current.addEventListener('focus', handleFocus);

            return () => {
                inputRef.current?.removeEventListener('focus', handleFocus);
            };
        }
    }, [isTyping, isListening, typingResult, currentIndex]);

    const handleNext = () => {
        if (currentIndex < shuffledWords.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
            setUserAnswer("");
            setTypingResult(null);
            setHintsUsed(0);
            setSelectedChoice(null);
            setHasPlayedAudio(false);
        } else {
            onComplete?.(score, wordResults);
        }
    };

    const handleReveal = () => {
        setShowAnswer(true);
        // Auto-play audio when revealing answer in flashcard mode
        if (currentWord.audioUrl) {
            setTimeout(() => {
                const audio = new Audio(currentWord.audioUrl);
                audio.play().catch(console.error);
            }, 300);
        }
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
        const elapsed = wordStartTimeRef.current != null ? (Date.now() - wordStartTimeRef.current) / 1000 : undefined;
        if (elapsed != null) setTimeSpentSeconds(elapsed);
        const isCorrect = normalize(userAnswer.trim()) === normalize(currentWord.word.trim());
        if (isCorrect) {
            if (typingResult !== "correct") {
                setCorrectCount((prev) => prev + 1);
            }
            setTypingResult("correct");

            // Record the word result
            const quality = calculateAnswerQuality(true, hintsUsed);
            addWordResult({ wordId: currentWord.id, quality });
        } else {
            setTypingResult("incorrect");

            // Record the word result
            const quality = calculateAnswerQuality(false, hintsUsed);
            addWordResult({ wordId: currentWord.id, quality });
        }
        setShowResultDialog(true);
    };

    const handleTryAgain = () => {
        setShowResultDialog(false);
        setTypingResult(null);
        setUserAnswer("");
        setTimeSpentSeconds(undefined);

        // Remove the last word result since user wants to try again
        setWordResults(prev => prev.slice(0, -1));

        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleNextFromDialog = () => {
        setShowResultDialog(false);
        setTimeSpentSeconds(undefined);
        handleNext();
    };

    const handleMultipleChoiceSelect = (selectedMeaning: string) => {
        if (!currentWord || typingResult) {
            return;
        }
        const elapsed = wordStartTimeRef.current != null ? (Date.now() - wordStartTimeRef.current) / 1000 : undefined;
        if (elapsed != null) setTimeSpentSeconds(elapsed);
        setSelectedChoice(selectedMeaning);
        const isCorrect = selectedMeaning === currentWord.meaning;

        if (isCorrect) {
            setCorrectCount((prev) => prev + 1);
            setTypingResult("correct");

            // Record the word result (no hints in multiple choice)
            const quality = calculateAnswerQuality(true, 0);
            addWordResult({ wordId: currentWord.id, quality });
        } else {
            setTypingResult("incorrect");

            // Record the word result
            const quality = calculateAnswerQuality(false, 0);
            addWordResult({ wordId: currentWord.id, quality });
        }

        setShowResultDialog(true);
    };

    const handlePlayListeningAudio = () => {
        if (currentWord.audioUrl) {
            const audio = new Audio(currentWord.audioUrl);
            audio.play().catch(console.error);
            setHasPlayedAudio(true);
        }
    };

    const handleCheckListeningAnswer = () => {
        if (!currentWord) {
            return;
        }
        const elapsed = wordStartTimeRef.current != null ? (Date.now() - wordStartTimeRef.current) / 1000 : undefined;
        if (elapsed != null) setTimeSpentSeconds(elapsed);
        const isCorrect = normalize(userAnswer.trim()) === normalize(currentWord.word.trim());
        if (isCorrect) {
            if (typingResult !== "correct") {
                setCorrectCount((prev) => prev + 1);
            }
            setTypingResult("correct");

            // Record the word result
            const quality = calculateAnswerQuality(true, hintsUsed);
            addWordResult({ wordId: currentWord.id, quality });
        } else {
            setTypingResult("incorrect");

            // Record the word result
            const quality = calculateAnswerQuality(false, hintsUsed);
            addWordResult({ wordId: currentWord.id, quality });
        }
        setShowResultDialog(true);
    };

    useEffect(() => {
        if (mode !== "typing" || !autoCheck || typingResult || !currentWord) {
            return;
        }

        const checkAnswer = () => {
            if (normalize(userAnswer) === normalize(currentWord.word)) {
                const elapsed = wordStartTimeRef.current != null ? (Date.now() - wordStartTimeRef.current) / 1000 : undefined;
                if (elapsed != null) setTimeSpentSeconds(elapsed);
                setTypingResult("correct");
                setCorrectCount((prev) => prev + 1);

                // Record the word result for auto-check
                const quality = calculateAnswerQuality(true, hintsUsed);
                addWordResult({ wordId: currentWord.id, quality });

                setShowResultDialog(true);
            }
        };

        checkAnswer();
    }, [autoCheck, currentWord, mode, typingResult, userAnswer, hintsUsed, addWordResult]);

    useEffect(() => {
        const resetState = () => {
            setShowAnswer(false);
            setUserAnswer("");
            setTypingResult(null);
            setSelectedChoice(null);
            setHasPlayedAudio(false);
        };

        resetState();
    }, [mode]);

    const renderCompletion = () => (
        <div className="text-center py-8 sm:py-16 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-4 sm:mb-6 animate-in zoom-in duration-700">
                <CheckCircle2 className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 gradient-brand bg-clip-text text-transparent">
                Excellent Work!
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg">
                You&apos;ve completed all <span className="font-semibold text-foreground">{shuffledWords.length}</span> words
            </p>
            <div className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-primary/10 border-2 border-primary/20">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <p className="text-3xl sm:text-4xl font-bold text-primary">
                    {score}%
                </p>
            </div>
        </div>
    );

    const renderFlashcardCard = () => (
        <>
            <div className="space-y-4 sm:space-y-8">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{currentWord.word}</h2>
                        {currentWord.audioUrl && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePlayAudio}
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl hover:scale-110 transition-transform flex-shrink-0"
                            >
                                <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>
                        )}
                    </div>
                    {currentWord.pronunciation && (
                        <p className="text-muted-foreground text-base sm:text-xl font-light mb-2 sm:mb-3">
                            {currentWord.pronunciation}
                        </p>
                    )}
                    {currentWord.partOfSpeech && (
                        <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-xs sm:text-sm font-semibold border border-primary/20">
                            {currentWord.partOfSpeech}
                        </span>
                    )}
                </div>

                {showAnswer && (
                    <div className="text-center pt-4 sm:pt-8 border-t-2 border-dashed border-border animate-in fade-in slide-in-from-bottom-6 duration-500">
                        <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground">{currentWord.meaning}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-center mt-6 sm:mt-10">
                {showAnswer ? (
                    <Button
                        onClick={handleNext}
                        size="lg"
                        className="w-full sm:min-w-[240px] sm:w-auto h-12 sm:h-14 text-base sm:text-lg rounded-xl gap-2 hover:scale-105 transition-transform"
                    >
                        {currentIndex < shuffledWords.length - 1 ? (
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
                        className="w-full sm:min-w-[240px] sm:w-auto h-12 sm:h-14 text-base sm:text-lg rounded-xl hover:scale-105 transition-transform"
                    >
                        Reveal Meaning
                    </Button>
                )}
            </div>
        </>
    );

    const renderTypingCard = () => (
        <div className="space-y-4 sm:space-y-8">
            <div className="text-center">
                <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-3 sm:mb-4 flex items-center justify-center gap-2">
                    <span className="h-px w-6 sm:w-8 bg-border"></span>
                    Translation
                    <span className="h-px w-6 sm:w-8 bg-border"></span>
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 px-2">{currentWord.meaning}</p>
                {currentWord.partOfSpeech && (
                    <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-xs sm:text-sm font-semibold border border-primary/20">
                        {currentWord.partOfSpeech}
                    </span>
                )}
            </div>

            <div className="space-y-4 sm:space-y-6">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type your answer..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(String(e.target.value).toLowerCase())}
                        onKeyDown={(e) => {
                            if (e.key !== "Enter") {
                                return;
                            }
                            if (userAnswer.trim().length === 0) {
                                return;
                            }
                            setTimeout(() => {
                                handleCheckTypingAnswer();
                            }, 100);
                        }}
                        className="w-full px-4 sm:px-6 py-4 sm:py-5 text-lg sm:text-2xl font-medium text-center rounded-xl sm:rounded-2xl border-2 border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/40"
                    />
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/5 to-purple/5 -z-10 blur-xl opacity-0 transition-opacity group-focus-within:opacity-100"></div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    {/* Hint Button */}
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleGetHint}
                        className="gap-2 rounded-xl hover:scale-105 transition-transform h-11 sm:h-12 text-sm sm:text-base"
                    >
                        <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
                        Get Hint
                        {hintsUsed > 0 && (
                            <span className="text-xs opacity-70">({hintsUsed})</span>
                        )}
                    </Button>

                    {/* Check Answer Button (only if auto-check is off) */}
                    <Button
                        size="lg"
                        className="min-w-[160px] sm:min-w-[200px] h-11 sm:h-12 text-sm sm:text-lg rounded-xl gap-2 hover:scale-105 transition-transform"
                        onClick={handleCheckTypingAnswer}
                        disabled={userAnswer.trim().length === 0}
                    >
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        Check Answer
                    </Button>
                </div>
            </div>
        </div>
    );

    const renderMultipleChoiceCard = () => (
        <div className="space-y-4 sm:space-y-8">
            <div className="text-center">
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{currentWord.word}</h2>
                    {currentWord.audioUrl && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePlayAudio}
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl hover:scale-110 transition-transform flex-shrink-0"
                        >
                            <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                    )}
                </div>
                {currentWord.pronunciation && (
                    <p className="text-muted-foreground text-base sm:text-xl font-light mb-2 sm:mb-3">
                        {currentWord.pronunciation}
                    </p>
                )}
                {currentWord.partOfSpeech && (
                    <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-xs sm:text-sm font-semibold border border-primary/20">
                        {currentWord.partOfSpeech}
                    </span>
                )}
            </div>

            <div className="space-y-4 sm:space-y-6">
                <p className="text-center text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Choose the correct meaning
                </p>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {multipleChoiceOptions.map((option, index) => {
                        const isSelected = selectedChoice === option;
                        const isCorrect = option === currentWord.meaning;
                        const showResult = typingResult !== null;

                        let buttonClass = "group relative w-full min-h-[60px] sm:min-h-[80px] p-4 sm:p-5 text-left rounded-xl sm:rounded-2xl border-2 transition-all duration-300 hover:shadow-lg";

                        if (!showResult) {
                            buttonClass += " border-border bg-gradient-to-br from-background to-muted/20 hover:border-primary hover:from-primary/5 hover:to-primary/10 hover:scale-[1.02] active:scale-[0.98]";
                        } else if (isCorrect) {
                            buttonClass += " border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-green-200 shadow-md";
                        } else if (isSelected && !isCorrect) {
                            buttonClass += " border-red-500 bg-gradient-to-br from-red-50 to-red-100 shadow-red-200 shadow-md";
                        } else {
                            buttonClass += " border-border/50 bg-muted/20 opacity-40";
                        }

                        return (
                            <Button
                                key={index}
                                variant="outline"
                                onClick={() => !typingResult && handleMultipleChoiceSelect(option)}
                                disabled={typingResult !== null}
                                className={buttonClass}
                            >
                                <span className="flex items-start gap-3 sm:gap-4 w-full">
                                    <span
                                        className={`
                                            flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm sm:text-base
                                            ${!showResult ? 'border-primary/30 bg-primary/5 text-primary group-hover:border-primary group-hover:bg-primary/10' : ''}
                                            ${showResult && isCorrect ? 'border-green-600 bg-green-600 text-white' : ''}
                                            ${showResult && isSelected && !isCorrect ? 'border-red-600 bg-red-600 text-white' : ''}
                                            ${showResult && !isCorrect && !isSelected ? 'border-border bg-muted/50 text-muted-foreground' : ''}
                                            transition-all duration-300
                                        `}
                                    >
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span
                                        className={`
                                            flex-1 text-sm sm:text-base leading-relaxed pt-1 sm:pt-1.5
                                            ${!showResult ? 'text-foreground group-hover:text-foreground' : ''}
                                            ${showResult && isCorrect ? 'text-green-700 font-medium' : ''}
                                            ${showResult && isSelected && !isCorrect ? 'text-red-700 font-medium' : ''}
                                            ${showResult && !isCorrect && !isSelected ? 'text-muted-foreground' : ''}
                                        `}
                                    >
                                        {option}
                                    </span>
                                    {showResult && isCorrect && (
                                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 animate-in zoom-in duration-300" />
                                    )}
                                    {showResult && isSelected && !isCorrect && (
                                        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0 animate-in zoom-in duration-300" />
                                    )}
                                </span>
                            </Button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    const renderListeningCard = () => (
        <div className="space-y-4 sm:space-y-8">
            <div className="text-center">
                <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-4 sm:mb-6 flex items-center justify-center gap-2">
                    <span className="h-px w-6 sm:w-8 bg-border"></span>
                    Listening Practice
                    <span className="h-px w-6 sm:w-8 bg-border"></span>
                </p>

                {/* Large Play Audio Button */}
                <div className="flex justify-center mb-4 sm:mb-6">
                    <Button
                        onClick={handlePlayListeningAudio}
                        size="lg"
                        className="h-20 w-20 sm:h-24 sm:w-24 rounded-full hover:scale-110 transition-all shadow-lg"
                        disabled={!currentWord.audioUrl}
                    >
                        {currentWord.audioUrl ? (
                            <Volume2 className="h-8 w-8 sm:h-10 sm:w-10" />
                        ) : (
                            <Play className="h-8 w-8 sm:h-10 sm:w-10" />
                        )}
                    </Button>
                </div>

                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    {!hasPlayedAudio
                        ? "Click the button to listen"
                        : "Type what you heard"}
                </p>

                {currentWord.partOfSpeech && (
                    <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-xs sm:text-sm font-semibold border border-primary/20">
                        {currentWord.partOfSpeech}
                    </span>
                )}
            </div>

            <div className="space-y-4 sm:space-y-6">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type what you heard..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key !== "Enter") {
                                return;
                            }
                            if (userAnswer.trim().length === 0) {
                                return;
                            }
                            setTimeout(() => {
                                handleCheckListeningAnswer();
                            }, 100);
                        }}
                        disabled={!hasPlayedAudio}
                        className="w-full px-4 sm:px-6 py-4 sm:py-5 text-lg sm:text-2xl font-medium text-center rounded-xl sm:rounded-2xl border-2 border-border bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder:text-muted-foreground/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary/5 to-purple/5 -z-10 blur-xl opacity-0 transition-opacity group-focus-within:opacity-100"></div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    {/* Replay Audio Button */}
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handlePlayListeningAudio}
                        disabled={!currentWord.audioUrl}
                        className="gap-2 rounded-xl hover:scale-105 transition-transform h-11 sm:h-12 text-sm sm:text-base"
                    >
                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        Replay
                    </Button>

                    {/* Hint Button */}
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleGetHint}
                        disabled={!hasPlayedAudio}
                        className="gap-2 rounded-xl hover:scale-105 transition-transform h-11 sm:h-12 text-sm sm:text-base"
                    >
                        <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />
                        Get Hint
                        {hintsUsed > 0 && (
                            <span className="text-xs opacity-70">({hintsUsed})</span>
                        )}
                    </Button>

                    {/* Check Answer Button */}
                    <Button
                        size="lg"
                        className="min-w-[160px] sm:min-w-[200px] h-11 sm:h-12 text-sm sm:text-lg rounded-xl gap-2 hover:scale-105 transition-transform"
                        onClick={handleCheckListeningAnswer}
                        disabled={userAnswer.trim().length === 0 || !hasPlayedAudio}
                    >
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        Check Answer
                    </Button>
                </div>
            </div>
        </div>
    );

    if (!currentWord) {
        return renderCompletion();
    }

    return (
        <div className="max-w-3xl mx-auto pb-safe">
            {/* Progress Bar */}
            <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                    <span>Progress</span>
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {currentIndex + 1} / {shuffledWords.length}
                    </span>
                </div>
                <div className="h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Settings and Summary Buttons */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm"
                >
                    <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Settings
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSummary(true)}
                    className="gap-1.5 sm:gap-2 rounded-full text-xs sm:text-sm"
                >
                    <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    View All Words
                </Button>
            </div>

            {/* Settings Dialog */}
            <PracticeSettingsDialog
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                currentSettings={currentSettings}
                onSave={handleSaveSettings}
            />

            {/* Words Summary Dialog */}
            <WordsSummaryDialog
                isOpen={showSummary}
                onClose={() => setShowSummary(false)}
                words={shuffledWords}
                currentIndex={currentIndex}
            />

            {/* Practice Card */}
            <div className="bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 mb-4 sm:mb-6 min-h-[320px] sm:min-h-[400px] flex flex-col justify-between shadow-xl shadow-primary/5 backdrop-blur-sm">
                {isFlashcard && renderFlashcardCard()}
                {isTyping && renderTypingCard()}
                {isMultipleChoice && renderMultipleChoiceCard()}
                {isListening && renderListeningCard()}
            </div>

            {/* Quick Actions - Only for Flashcard Mode */}
            {isFlashcard && showAnswer && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            setCorrectCount(correctCount + 1);
                            // Record as perfect for "I Know This"
                            addWordResult({ wordId: currentWord.id, quality: AnswerQuality.PERFECT });
                            handleNext();
                        }}
                        className="gap-2 rounded-xl border-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:scale-105 transition-all h-12 sm:h-auto text-sm sm:text-base"
                    >
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        I Know This
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                            // Record as incorrect for "Still Learning"
                            addWordResult({ wordId: currentWord.id, quality: AnswerQuality.INCORRECT });
                            handleNext();
                        }}
                        className="gap-2 rounded-xl border-2 text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:scale-105 transition-all h-12 sm:h-auto text-sm sm:text-base"
                    >
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        Still Learning
                    </Button>
                </div>
            )}

            {/* Practice Result Dialog */}
            {(isTyping || isMultipleChoice || isListening) && (
                <PracticeResultDialog
                    isOpen={showResultDialog}
                    isCorrect={typingResult === "correct"}
                    userAnswer={isMultipleChoice ? (selectedChoice || "") : userAnswer}
                    correctAnswer={currentWord.word}
                    meaning={currentWord.meaning}
                    pronunciation={currentWord.pronunciation}
                    partOfSpeech={currentWord.partOfSpeech}
                    audioUrl={currentWord.audioUrl}
                    imageUrl={currentWord.imageUrl}
                    examples={currentWord.examples}
                    timeSpentSeconds={timeSpentSeconds}
                    onTryAgain={handleTryAgain}
                    onNext={handleNextFromDialog}
                    isLastWord={isLastWord}
                />
            )}
        </div>
    );
}
