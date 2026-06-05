"use client";

import PracticeSettingsDialog, {
    type PracticeSettings,
} from "@/components/features/vocabulary/practice-settings-dialog";
import PracticeResultDialog from "@/components/features/vocabulary/practice-result-dialog";
import {
    PracticeSessionSummary,
} from "@/components/features/vocabulary/practice-session-summary";
import WordsSummaryDialog from "@/components/features/vocabulary/words-summary-dialog";
import { Button } from "@/components/ui/button";
import {
    calculateAnswerQuality,
    flashcardRatingToQuality,
    isWeakAnswer,
    type FlashcardRating,
} from "@/lib/answer-quality";
import { fireMiniConfetti } from "@/lib/confetti";
import { recordPracticeWords, type DailyHabitState } from "@/lib/daily-habit";
import { playAudioUrl } from "@/lib/practice-audio";
import { pickMilestoneMessage } from "@/lib/practice-feedback";
import type { PracticeSessionKind } from "@/lib/practice-session";
import {
    stageHintPolicy,
    stageLabel,
    type WordLearningStage,
} from "@/lib/word-progress-stage";
import {
    resolveActiveMode,
    resolvePracticeSettings,
    SETTINGS_STORAGE_KEY,
    type ActivePracticeMode,
} from "@/lib/practice-settings";
import {
    getClozePrompt,
    getWordExamples,
    maskWordInExamples,
    normalizeAnswer,
    normalizeForHintPrefix,
    shuffleArray,
} from "@/lib/practice-utils";
import { setLocalStorageItem } from "@/lib/local-storage";
import { AnswerQuality } from "@/types/word-progress/word-progress.type";
import { IWord } from "@/types/courses/courses.type";
import {
    AlertTriangle,
    Lightbulb,
    List,
    Play,
    Settings2,
    Volume2,
} from "lucide-react";
import Image from "next/image";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
} from "react";
import { toast } from "sonner";

export interface WordResult {
    wordId: string;
    quality: AnswerQuality;
}

export interface SessionCompletePayload {
    score: number;
    wordResults: WordResult[];
    habitState: DailyHabitState;
}

interface VocabularyPracticeProps {
    /** All session words (used in summary). */
    words: IWord[];
    /** Progress-ordered queue; defaults to shuffled `words`. */
    practiceQueue?: IWord[];
    stagesByWordId?: Record<string, WordLearningStage>;
    sessionKind?: PracticeSessionKind;
    leechWordIds?: Set<string>;
    onComplete?: (payload: SessionCompletePayload) => void;
}

function WordPracticeHints({
    maskedExamples,
    imageUrl,
    showImageHints,
}: Readonly<{
    maskedExamples: string[];
    imageUrl?: string;
    showImageHints: boolean;
}>) {
    const showImage = showImageHints && Boolean(imageUrl?.trim());
    const showExamples = maskedExamples.length > 0;
    if (!showImage && !showExamples) return null;

    return (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border/50 mx-auto w-full">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start text-left">
                {showExamples && (
                    <div className="flex-1 min-w-0 w-full">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Example sentences
                        </p>
                        <ul className="space-y-1.5 text-sm sm:text-base text-muted-foreground max-h-24 sm:max-h-32 overflow-y-auto overscroll-contain pr-1">
                            {maskedExamples.map((s) => (
                                <li key={s} className="italic">&ldquo;{s}&rdquo;</li>
                            ))}
                        </ul>
                    </div>
                )}
                {showImage && imageUrl && (
                    <div className="shrink-0 w-full sm:w-40">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                            Image hint
                        </p>
                        <div className="rounded-xl overflow-hidden bg-muted border border-border aspect-square max-h-40 sm:max-h-44 mx-auto sm:mx-0 w-full sm:w-40">
                            <Image
                                src={imageUrl}
                                alt=""
                                width={160}
                                height={160}
                                className="w-full h-full object-cover"
                                unoptimized
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VocabularyPractice({
    words,
    practiceQueue,
    stagesByWordId,
    sessionKind = "new",
    leechWordIds,
    onComplete,
}: Readonly<VocabularyPracticeProps>) {
    const [queue, setQueue] = useState(() => practiceQueue ?? shuffleArray(words));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<"practice" | "summary">("practice");
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState("");
    const [practiceSettings, setPracticeSettings] = useState<PracticeSettings>(() =>
        resolvePracticeSettings(sessionKind),
    );
    const [practiceSettingsReady, setPracticeSettingsReady] = useState(false);
    const { mode, autoCheck, showExampleHints, showImageHints } = practiceSettings;
    const [typingResult, setTypingResult] = useState<"correct" | "incorrect" | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [showWordsList, setShowWordsList] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
    const [wordResults, setWordResults] = useState<WordResult[]>([]);
    const [pendingResult, setPendingResult] = useState<WordResult | null>(null);
    const [sessionStreak, setSessionStreak] = useState(0);
    const [habitState, setHabitState] = useState<DailyHabitState | null>(null);
    const [timeSpentSeconds, setTimeSpentSeconds] = useState<number | undefined>(undefined);
    const [feedbackSeed] = useState(() => Date.now());
    const inputRef = useRef<HTMLInputElement>(null);
    const wordStartTimeRef = useRef<number | null>(null);

    useEffect(() => {
        startTransition(() => {
            setPracticeSettings(resolvePracticeSettings(sessionKind));
            setPracticeSettingsReady(true);
        });
    }, [sessionKind]);

    useEffect(() => {
        if (!practiceSettingsReady) return;
        try {
            setLocalStorageItem(SETTINGS_STORAGE_KEY, JSON.stringify(practiceSettings));
        } catch (error) {
            console.error("Failed to save practice settings:", error);
        }
    }, [practiceSettings, practiceSettingsReady]);

    const currentWord = queue[currentIndex];
    const currentStage: WordLearningStage =
        currentWord != null ? (stagesByWordId?.[currentWord.id] ?? "new") : "new";
    const stageHints = stageHintPolicy(currentStage);
    const effectiveExampleHints = showExampleHints && stageHints.showExampleHints;
    const effectiveImageHints = showImageHints && stageHints.showImageHints;

    const clozePrompt = useMemo(
        () => (currentWord ? getClozePrompt(currentWord) : null),
        [currentWord],
    );
    const activeMode: ActivePracticeMode = currentWord
        ? resolveActiveMode(mode, currentIndex, clozePrompt != null, currentStage)
        : "typing";

    const rawExamples = useMemo(
        () => (currentWord ? getWordExamples(currentWord) : []),
        [currentWord],
    );
    const maskedExamples = useMemo(
        () =>
            currentWord && effectiveExampleHints && rawExamples.length > 0
                ? maskWordInExamples(currentWord.word, rawExamples)
                : [],
        [currentWord, effectiveExampleHints, rawExamples],
    );

    const progress = queue.length > 0 ? ((currentIndex + 1) / queue.length) * 100 : 100;
    const isLeech = currentWord != null && leechWordIds?.has(currentWord.id);

    function scoreFromResults(results: WordResult[]): number {
        if (results.length === 0) return 0;
        const correct = results.filter((r) => !isWeakAnswer(r.quality)).length;
        return Math.round((correct / results.length) * 100);
    }

    const commitResult = useCallback(
        (result: WordResult) => {
            setWordResults((prev) => [...prev, result]);
            if (isWeakAnswer(result.quality)) {
                setSessionStreak(0);
            } else {
                setSessionStreak((s) => {
                    const next = s + 1;
                    const msg = pickMilestoneMessage(next);
                    if (msg) {
                        fireMiniConfetti();
                        toast.success(msg);
                    }
                    return next;
                });
            }
        },
        [],
    );

    const stageResult = useCallback((result: WordResult) => {
        setPendingResult(result);
    }, []);

    const resetWordUi = useCallback(() => {
        setShowAnswer(false);
        setUserAnswer("");
        setTypingResult(null);
        setHintsUsed(0);
        setSelectedChoice(null);
        setHasPlayedAudio(false);
        setTimeSpentSeconds(undefined);
        setPendingResult(null);
    }, []);

    const finishSession = useCallback((results: WordResult[]) => {
        const habit = recordPracticeWords(results.length);
        setWordResults(results);
        setHabitState(habit);
        setPhase("summary");
    }, []);

    const handleNextFromDialog = useCallback(() => {
        setShowResultDialog(false);
        const resultToCommit = pendingResult;
        const nextResults = resultToCommit ? [...wordResults, resultToCommit] : wordResults;
        if (resultToCommit) {
            commitResult(resultToCommit);
            setPendingResult(null);
        }
        if (currentIndex < queue.length - 1) {
            setCurrentIndex((i) => i + 1);
            resetWordUi();
        } else {
            finishSession(nextResults);
            resetWordUi();
        }
    }, [
        pendingResult,
        wordResults,
        commitResult,
        currentIndex,
        queue.length,
        resetWordUi,
        finishSession,
    ]);

    const handleTryAgain = useCallback(() => {
        setShowResultDialog(false);
        setTypingResult(null);
        setUserAnswer("");
        setTimeSpentSeconds(undefined);
        setPendingResult(null);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const getNextHint = useCallback((): string => {
        if (!currentWord) return "";
        const correctWord = normalizeForHintPrefix(currentWord.word.trim());
        const currentInput = normalizeForHintPrefix(userAnswer);
        let correctPrefixLength = 0;
        for (let i = 0; i < Math.min(currentInput.length, correctWord.length); i++) {
            if (currentInput[i] === correctWord[i]) correctPrefixLength = i + 1;
            else break;
        }
        if (correctPrefixLength < correctWord.length) {
            return correctWord.substring(0, correctPrefixLength + 1);
        }
        return correctWord;
    }, [currentWord, userAnswer]);

    const handleGetHint = () => {
        const hint = getNextHint();
        setUserAnswer(hint);
        setHintsUsed((h) => h + 1);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.setSelectionRange(hint.length, hint.length);
            }
        }, 0);
    };

    const checkTypedAnswer = (expected: string) => {
        if (!currentWord || typingResult || showResultDialog) return;
        const elapsed =
            wordStartTimeRef.current != null
                ? (Date.now() - wordStartTimeRef.current) / 1000
                : undefined;
        if (elapsed != null) setTimeSpentSeconds(elapsed);
        const isCorrect = normalizeAnswer(userAnswer.trim()) === normalizeAnswer(expected.trim());
        const quality = calculateAnswerQuality(isCorrect, hintsUsed, elapsed);
        stageResult({ wordId: currentWord.id, quality });
        setTypingResult(isCorrect ? "correct" : "incorrect");
        setShowResultDialog(true);
        inputRef.current?.blur();
    };

    const submitAnswerOnEnter = (
        e: React.KeyboardEvent<HTMLInputElement>,
        submit: () => void,
        canSubmit = true,
    ) => {
        if (e.key !== "Enter" || !canSubmit || !userAnswer.trim() || typingResult || showResultDialog) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        submit();
    };

    const handleCheckTypingAnswer = () => checkTypedAnswer(currentWord?.word ?? "");
    const handleCheckClozeAnswer = () => checkTypedAnswer(clozePrompt?.answer ?? currentWord?.word ?? "");
    const handleCheckListeningAnswer = () => checkTypedAnswer(currentWord?.word ?? "");

    const handleMultipleChoiceSelect = (selectedMeaning: string) => {
        if (!currentWord || typingResult) return;
        const elapsed =
            wordStartTimeRef.current != null
                ? (Date.now() - wordStartTimeRef.current) / 1000
                : undefined;
        if (elapsed != null) setTimeSpentSeconds(elapsed);
        setSelectedChoice(selectedMeaning);
        const isCorrect = selectedMeaning === currentWord.meaning;
        const quality = calculateAnswerQuality(isCorrect, 0, elapsed);
        stageResult({ wordId: currentWord.id, quality });
        setTypingResult(isCorrect ? "correct" : "incorrect");
        setShowResultDialog(true);
    };

    const handleFlashcardRate = (rating: FlashcardRating) => {
        if (!currentWord) return;
        const result = { wordId: currentWord.id, quality: flashcardRatingToQuality(rating) };
        const nextResults = [...wordResults, result];
        commitResult(result);
        if (currentIndex < queue.length - 1) {
            setCurrentIndex((i) => i + 1);
            resetWordUi();
        } else {
            finishSession(nextResults);
        }
    };

    const generateMultipleChoiceOptions = (correctWord: IWord, allWords: IWord[]): string[] => {
        const options = [correctWord.meaning];
        const others = shuffleArray(allWords.filter((w) => w.id !== correctWord.id));
        for (let i = 0; i < Math.min(3, others.length); i++) options.push(others[i].meaning);
        return shuffleArray(options);
    };

    const multipleChoiceOptions = useMemo(() => {
        if (activeMode === "multiple-choice" && currentWord) {
            return generateMultipleChoiceOptions(currentWord, queue);
        }
        return [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, activeMode, currentWord, queue]);

    useEffect(() => {
        if (["typing", "listening", "cloze", "multiple-choice"].includes(activeMode)) {
            wordStartTimeRef.current = Date.now();
        }
    }, [currentIndex, activeMode]);

    useEffect(() => {
        if (
            activeMode !== "typing" ||
            !autoCheck ||
            typingResult ||
            showResultDialog ||
            !currentWord
        ) {
            return;
        }
        if (normalizeAnswer(userAnswer) === normalizeAnswer(currentWord.word)) {
            const elapsed =
                wordStartTimeRef.current != null
                    ? (Date.now() - wordStartTimeRef.current) / 1000
                    : undefined;
            if (elapsed != null) setTimeSpentSeconds(elapsed);
            setTypingResult("correct");
            stageResult({
                wordId: currentWord.id,
                quality: calculateAnswerQuality(true, hintsUsed, elapsed),
            });
            setShowResultDialog(true);
            inputRef.current?.blur();
        }
    }, [autoCheck, currentWord, activeMode, typingResult, showResultDialog, userAnswer, hintsUsed, stageResult]);

    useEffect(() => {
        if ((activeMode === "typing" || activeMode === "listening" || activeMode === "cloze") && !typingResult && !showResultDialog) {
            inputRef.current?.focus();
        }
    }, [activeMode, typingResult, showResultDialog, currentIndex]);

    useEffect(() => {
        if (showResultDialog) {
            inputRef.current?.blur();
        }
    }, [showResultDialog]);

    const handleRetryMissed = () => {
        const missedIds = new Set(
            wordResults.filter((r) => isWeakAnswer(r.quality)).map((r) => r.wordId),
        );
        const missed = words.filter((w) => missedIds.has(w.id));
        if (missed.length === 0) return;
        setQueue(shuffleArray(missed));
        setCurrentIndex(0);
        setWordResults([]);
        setPhase("practice");
        resetWordUi();
    };

    if (phase === "summary" && habitState) {
        return (
            <PracticeSessionSummary
                words={words}
                wordResults={wordResults}
                score={scoreFromResults(wordResults)}
                habitState={habitState}
                onContinue={() =>
                    onComplete?.({
                        score: scoreFromResults(wordResults),
                        wordResults,
                        habitState,
                    })
                }
                onRetryMissed={
                    wordResults.some((r) => isWeakAnswer(r.quality)) ? handleRetryMissed : undefined
                }
            />
        );
    }

    if (!currentWord) return null;

    const modeLabel =
        mode === "mixed" ? `Mixed · ${activeMode.replace("-", " ")}` : activeMode.replace("-", " ");

    return (
        <div className="max-w-4xl pb-safe">
            <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                    <span>Progress</span>
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {currentIndex + 1} / {queue.length}
                    </span>
                </div>
                <div className="h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {sessionStreak >= 3 && (
                    <p className="text-xs text-primary mt-1.5 font-medium">{sessionStreak} in a row</p>
                )}
            </div>

            <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="gap-1.5 rounded-full text-xs sm:text-sm"
                >
                    <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Settings
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWordsList(true)}
                    className="gap-1.5 rounded-full text-xs sm:text-sm"
                >
                    <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Words
                </Button>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground capitalize">
                    {modeLabel}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {stageLabel(currentStage)}
                </span>
            </div>

            <PracticeSettingsDialog
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                currentSettings={practiceSettings}
                onSave={setPracticeSettings}
            />

            <WordsSummaryDialog
                isOpen={showWordsList}
                onClose={() => setShowWordsList(false)}
                words={queue}
                currentIndex={currentIndex}
            />

            {isLeech && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-800/50 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    <span>Tricky word — take an extra moment with the examples.</span>
                </div>
            )}

            <div className="bg-gradient-to-br from-card to-card/50 border-2 border-border rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-10 mb-4 sm:mb-6 min-h-[320px] sm:min-h-[400px] flex flex-col justify-between shadow-xl shadow-primary/5">
                {activeMode === "flashcard" && (
                    <>
                        <div className="space-y-4 sm:space-y-8 text-center">
                            <div>
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <h2 className="text-3xl sm:text-4xl font-bold">{currentWord.word}</h2>
                                    {currentWord.audioUrl && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => playAudioUrl(currentWord.audioUrl)}
                                            className="rounded-xl"
                                        >
                                            <Volume2 className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                                {currentWord.pronunciation && (
                                    <p className="text-muted-foreground text-lg mb-2">{currentWord.pronunciation}</p>
                                )}
                                {currentWord.partOfSpeech && (
                                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                        {currentWord.partOfSpeech}
                                    </span>
                                )}
                                {!showAnswer && (
                                    <WordPracticeHints
                                        maskedExamples={maskedExamples}
                                        imageUrl={currentWord.imageUrl}
                                        showImageHints={effectiveImageHints}
                                    />
                                )}
                            </div>
                            {showAnswer && (
                                <div className="pt-6 border-t-2 border-dashed border-border animate-in fade-in">
                                    <p className="text-2xl font-semibold">{currentWord.meaning}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center mt-6">
                            {showAnswer ? (
                                <p className="text-sm text-muted-foreground">How well did you know it?</p>
                            ) : (
                                <Button size="lg" onClick={() => {
                                    setShowAnswer(true);
                                    if (currentWord.audioUrl) {
                                        setTimeout(() => playAudioUrl(currentWord.audioUrl), 300);
                                    }
                                }} className="rounded-xl">
                                    Reveal meaning
                                </Button>
                            )}
                        </div>
                    </>
                )}

                {activeMode === "typing" && (
                    <div className="space-y-6 text-center">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Translation</p>
                            <p className="text-2xl font-bold mb-2">{currentWord.meaning}</p>
                            <WordPracticeHints
                                maskedExamples={maskedExamples}
                                imageUrl={currentWord.imageUrl}
                                showImageHints={effectiveImageHints}
                            />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type your answer..."
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(String(e.target.value).toLowerCase())}
                            onKeyDown={(e) => submitAnswerOnEnter(e, handleCheckTypingAnswer)}
                            className="w-full px-4 py-4 text-xl text-center rounded-xl border-2 border-border bg-background focus:border-primary outline-none"
                        />
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button variant="outline" onClick={handleGetHint} className="gap-2 rounded-xl">
                                <Lightbulb className="h-4 w-4" />
                                Hint {hintsUsed > 0 ? `(${hintsUsed})` : ""}
                            </Button>
                            {!autoCheck && (
                                <Button onClick={handleCheckTypingAnswer} disabled={!userAnswer.trim()} className="rounded-xl">
                                    Check
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {activeMode === "cloze" && clozePrompt && (
                    <div className="space-y-6 text-center">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Fill in the blank</p>
                        <p className="text-lg sm:text-xl italic leading-relaxed px-2">&ldquo;{clozePrompt.sentence}&rdquo;</p>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type the missing word..."
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(String(e.target.value).toLowerCase())}
                            onKeyDown={(e) => submitAnswerOnEnter(e, handleCheckClozeAnswer)}
                            className="w-full px-4 py-4 text-xl text-center rounded-xl border-2 border-border bg-background focus:border-primary outline-none"
                        />
                        <div className="flex justify-center gap-2">
                            <Button variant="outline" onClick={handleGetHint} className="gap-2 rounded-xl">
                                <Lightbulb className="h-4 w-4" />
                                Hint
                            </Button>
                            <Button onClick={handleCheckClozeAnswer} disabled={!userAnswer.trim()} className="rounded-xl">
                                Check
                            </Button>
                        </div>
                    </div>
                )}

                {activeMode === "multiple-choice" && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold mb-2">{currentWord.word}</h2>
                            <WordPracticeHints
                                maskedExamples={maskedExamples}
                                imageUrl={currentWord.imageUrl}
                                showImageHints={effectiveImageHints}
                            />
                        </div>
                        <div className="grid gap-3">
                            {multipleChoiceOptions.map((option, index) => (
                                <Button
                                    key={option}
                                    variant="outline"
                                    onClick={() => !typingResult && handleMultipleChoiceSelect(option)}
                                    disabled={typingResult !== null}
                                    className="min-h-[56px] justify-start text-left rounded-xl"
                                >
                                    <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                                    {option}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {activeMode === "listening" && (
                    <div className="space-y-6 text-center">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Listening</p>
                        <Button
                            size="lg"
                            onClick={() => {
                                playAudioUrl(currentWord.audioUrl);
                                setHasPlayedAudio(true);
                            }}
                            disabled={!currentWord.audioUrl}
                            className="h-20 w-20 rounded-full"
                        >
                            {currentWord.audioUrl ? <Volume2 className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                        </Button>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type what you heard..."
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={!hasPlayedAudio}
                            onKeyDown={(e) =>
                                submitAnswerOnEnter(e, handleCheckListeningAnswer, hasPlayedAudio)
                            }
                            className="w-full px-4 py-4 text-xl text-center rounded-xl border-2 border-border bg-background focus:border-primary outline-none disabled:opacity-50"
                        />
                        <div className="flex justify-center gap-2 flex-wrap">
                            <Button variant="outline" onClick={() => playAudioUrl(currentWord.audioUrl)} className="rounded-xl">
                                Replay
                            </Button>
                            <Button variant="outline" onClick={handleGetHint} disabled={!hasPlayedAudio} className="rounded-xl">
                                Hint
                            </Button>
                            <Button onClick={handleCheckListeningAnswer} disabled={!userAnswer.trim() || !hasPlayedAudio} className="rounded-xl">
                                Check
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {activeMode === "flashcard" && showAnswer && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 animate-in fade-in">
                    <Button
                        variant="outline"
                        onClick={() => handleFlashcardRate("easy")}
                        className="rounded-xl border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                    >
                        Easy
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleFlashcardRate("good")}
                        className="rounded-xl border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100"
                    >
                        Got it
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleFlashcardRate("hard")}
                        className="rounded-xl border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100"
                    >
                        Hard
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => handleFlashcardRate("forgot")}
                        className="rounded-xl border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                    >
                        Forgot
                    </Button>
                </div>
            )}

            {activeMode !== "flashcard" && (
                <PracticeResultDialog
                    isOpen={showResultDialog}
                    isCorrect={typingResult === "correct"}
                    userAnswer={activeMode === "multiple-choice" ? (selectedChoice ?? "") : userAnswer}
                    correctAnswer={activeMode === "cloze" ? (clozePrompt?.answer ?? currentWord.word) : currentWord.word}
                    meaning={currentWord.meaning}
                    pronunciation={currentWord.pronunciation}
                    partOfSpeech={currentWord.partOfSpeech}
                    audioUrl={currentWord.audioUrl}
                    imageUrl={currentWord.imageUrl}
                    examples={rawExamples}
                    timeSpentSeconds={timeSpentSeconds}
                    feedbackSeed={feedbackSeed + currentIndex}
                    onTryAgain={handleTryAgain}
                    onNext={handleNextFromDialog}
                    isLastWord={currentIndex === queue.length - 1}
                />
            )}
        </div>
    );
}
