"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import { AdaptiveText } from "@/components/common/adaptive-text";
import { LeechWordBanner } from "@/components/features/vocabulary/leech-word-banner";
import { NewWordIntroPanel } from "@/components/features/vocabulary/new-word-intro-panel";
import { PracticeCardShell } from "@/components/features/vocabulary/practice-card-shell";
import { PracticeExerciseBody } from "@/components/features/vocabulary/practice-exercise-body";
import { PracticeExerciseHeader } from "@/components/features/vocabulary/practice-exercise-header";
import { PracticeProgressHeader } from "@/components/features/vocabulary/practice-progress-header";
import { PracticeResultPanel } from "@/components/features/vocabulary/practice-result-panel";
import { PracticeToolbar } from "@/components/features/vocabulary/practice-toolbar";
import { PracticeWordChoiceGrid } from "@/components/features/vocabulary/practice-word-choice-grid";
import { WordPracticeHints } from "@/components/features/vocabulary/word-practice-hints";
import { PracticeSessionSummary } from "@/components/features/vocabulary/practice-session-summary";
import { Button } from "@/components/ui/button";
import {
    calculateAnswerQuality,
    flashcardRatingToQuality,
    isWeakAnswer,
    type FlashcardRating,
} from "@/lib/answer-quality";
import { fireMiniConfetti } from "@/lib/confetti";
import {
    localDateString,
    recordPracticeWordsLocally,
} from "@/lib/daily-habit";
import { getLastLearnCourse } from "@/lib/learning-session";
import { recordSession } from "@/lib/session-history";
import type { IDailyHabit } from "@/types/daily-habit/daily-habit.type";
import { useRecordDailyPracticeMutation } from "@/queries/daily-habit.query";
import { playAudioUrl, preloadAudioUrl } from "@/lib/practice-audio";
import { pickMilestoneMessage } from "@/lib/practice-feedback";
import type { PracticeSessionKind } from "@/lib/practice-session";
import {
    playPracticeErrorSound,
    playPracticeSuccessSound,
} from "@/lib/practice-sounds";
import {
    stageHintPolicy,
    type WordLearningStage,
} from "@/lib/word-progress-stage";
import { PEDAGOGY } from "@/lib/learning-pedagogy";
import {
    buildMixedModePlan,
    mixedModePlanKey,
    resolveActiveMode,
    wordOccurrenceAtIndex,
    type ActivePracticeMode,
} from "@/lib/practice-settings";
import { usePracticeSettings } from "@/hooks/usePracticeSettings.hook";
import {
    generateWordChoiceOptions,
    getClozePrompt,
    getWordExamples,
    maskWordInExamples,
    normalizeAnswer,
    normalizeForHintPrefix,
    shuffleArray,
} from "@/lib/practice-utils";
import { useNewWordIntro } from "@/hooks/useNewWordIntro.hook";
import { LONG_TEXT_WRAP } from "@/lib/long-text";
import type { SessionCompletePayload, WordResult } from "@/types/practice/practice.type";
import { IWord } from "@/types/courses/courses.type";
import {
    Lightbulb,
    Play,
    Volume2,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { toast } from "sonner";

export type { SessionCompletePayload, WordResult } from "@/types/practice/practice.type";

interface VocabularyPracticeProps {
    /** All session words (used in summary). */
    words: IWord[];
    /** Progress-ordered queue; defaults to shuffled `words`. */
    practiceQueue?: IWord[];
    stagesByWordId?: Record<string, WordLearningStage>;
    sessionKind?: PracticeSessionKind;
    leechWordIds?: Set<string>;
    onComplete?: (payload: SessionCompletePayload, destination?: string) => void;
    onSummaryReady?: () => void;
}

export default function VocabularyPractice({
    words,
    practiceQueue,
    stagesByWordId,
    leechWordIds,
    onComplete,
    onSummaryReady,
}: Readonly<VocabularyPracticeProps>) {
    const [queue, setQueue] = useState(() => practiceQueue ?? shuffleArray(words));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<"practice" | "summary">("practice");
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState("");
    const { settings: practiceSettings } = usePracticeSettings();
    const { mode, autoCheck, showExampleHints, showImageHints, soundEnabled } = practiceSettings;
    const [typingResult, setTypingResult] = useState<"correct" | "incorrect" | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [showWordsList, setShowWordsList] = useState(false);
    const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
    const [wordResults, setWordResults] = useState<WordResult[]>([]);
    const [pendingResult, setPendingResult] = useState<WordResult | null>(null);
    const [sessionStreak, setSessionStreak] = useState(0);
    const [habitState, setHabitState] = useState<IDailyHabit | null>(null);
    const recordDailyPractice = useRecordDailyPracticeMutation();
    const [timeSpentSeconds, setTimeSpentSeconds] = useState<number | undefined>(undefined);
    const [feedbackSeed] = useState(() => Date.now());
    const [introCompletedIds, setIntroCompletedIds] = useState<Set<string>>(
        () => new Set(),
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const wordStartTimeRef = useRef<number | null>(null);
    const sessionStreakRef = useRef(0);

    const focusPracticeInput = useCallback(() => {
        requestAnimationFrame(() => {
            setTimeout(() => {
                const el = inputRef.current;
                if (!el) return;
                el.focus({ preventScroll: false });
                el.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 80);
        });
    }, []);

    const currentWord = queue[currentIndex];
    const currentStage: WordLearningStage =
        currentWord != null ? (stagesByWordId?.[currentWord.id] ?? "new") : "new";
    const currentOccurrence = currentWord
        ? wordOccurrenceAtIndex(queue, currentIndex)
        : 0;
    let hintStage: WordLearningStage = currentStage;
    if (currentStage === "new" && currentOccurrence > 0) {
        hintStage = currentOccurrence === 1 ? "learning" : "due";
    }
    const stageHints = stageHintPolicy(hintStage);
    const effectiveExampleHints = showExampleHints && stageHints.showExampleHints;
    const effectiveImageHints = showImageHints && stageHints.showImageHints;

    const clozePrompt = useMemo(
        () => (currentWord ? getClozePrompt(currentWord) : null),
        [currentWord],
    );
    const mixedModePlan = useMemo(() => {
        if (mode !== "mixed") return null;
        return buildMixedModePlan(queue, stagesByWordId, { leechWordIds });
    }, [mode, queue, stagesByWordId, leechWordIds]);
    const activeMode: ActivePracticeMode = currentWord
        ? resolveActiveMode(
              mode,
              clozePrompt != null,
              Boolean(currentWord.audioUrl),
              mixedModePlan?.get(
                  mixedModePlanKey(currentWord.id, currentOccurrence),
              ),
              currentIndex,
              currentStage,
          )
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

    const isLeech = currentWord != null && leechWordIds?.has(currentWord.id);

    const { showIntro, startExercise } = useNewWordIntro({
        word: currentWord,
        wordId: currentWord?.id,
        stage: currentStage,
        introAlreadySeen: currentWord
            ? introCompletedIds.has(currentWord.id)
            : false,
        onExerciseStart: () => {
            if (currentWord) {
                setIntroCompletedIds((prev) => new Set(prev).add(currentWord.id));
            }
            focusPracticeInput();
        },
    });

    function scoreFromResults(results: WordResult[]): number {
        if (results.length === 0) return 0;
        const correct = results.filter((r) => !isWeakAnswer(r.quality)).length;
        return Math.round((correct / results.length) * 100);
    }

    const commitResult = useCallback(
        (result: WordResult) => {
            setWordResults((prev) => {
                const existingIndex = prev.findIndex((r) => r.wordId === result.wordId);
                if (existingIndex >= 0) {
                    const next = [...prev];
                    next[existingIndex] = result;
                    return next;
                }
                return [...prev, result];
            });
            if (isWeakAnswer(result.quality)) {
                sessionStreakRef.current = 0;
                setSessionStreak(0);
            } else {
                const next = sessionStreakRef.current + 1;
                sessionStreakRef.current = next;
                setSessionStreak(next);
                const msg = pickMilestoneMessage(next);
                if (msg) {
                    fireMiniConfetti();
                    toast.success(msg);
                }
            }
        },
        [],
    );

    const playResultSound = useCallback(
        (isCorrect: boolean) => {
            if (!soundEnabled) return;
            if (isCorrect) playPracticeSuccessSound();
            else playPracticeErrorSound();
        },
        [soundEnabled],
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

    const finishSession = useCallback(
        (results: WordResult[]) => {
            const wordCount = results.length;
            const localHabit = recordPracticeWordsLocally(wordCount);
            setWordResults(results);
            setHabitState(localHabit);
            setPhase("summary");
            onSummaryReady?.();

            // Local-only session history (no backend).
            recordSession(
                {
                    courseName: getLastLearnCourse()?.name,
                    words: wordCount,
                    score: scoreFromResults(results),
                    xp: results.filter((r) => !isWeakAnswer(r.quality)).length * 10,
                },
                new Date().toISOString(),
            );

            recordDailyPractice.mutate(
                { wordCount, clientDate: localDateString() },
                {
                    onSuccess: (habit) => {
                        setHabitState(habit);
                    },
                },
            );
        },
        [recordDailyPractice, onSummaryReady],
    );

    const mergeWordResult = useCallback(
        (results: WordResult[], result: WordResult): WordResult[] => {
            const existingIndex = results.findIndex((r) => r.wordId === result.wordId);
            if (existingIndex >= 0) {
                return results.map((r, i) => (i === existingIndex ? result : r));
            }
            return [...results, result];
        },
        [],
    );

    const handleConfirmEndSession = useCallback(() => {
        setShowEndSessionDialog(false);
        setShowResultDialog(false);
        let results = wordResults;
        if (pendingResult && !isWeakAnswer(pendingResult.quality)) {
            results = mergeWordResult(wordResults, pendingResult);
        }
        finishSession(results);
        resetWordUi();
    }, [finishSession, wordResults, pendingResult, mergeWordResult, resetWordUi]);

    const advanceAfterAnswer = useCallback(
        (result: WordResult, word: IWord) => {
            if (isWeakAnswer(result.quality)) {
                sessionStreakRef.current = 0;
                setSessionStreak(0);
                setQueue((prev) => [...prev, word]);
                setCurrentIndex((i) => i + 1);
                resetWordUi();
                focusPracticeInput();
                return;
            }

            commitResult(result);
            const mergedResults = mergeWordResult(wordResults, result);

            if (currentIndex < queue.length - 1) {
                setCurrentIndex((i) => i + 1);
                resetWordUi();
                focusPracticeInput();
                return;
            }

            finishSession(mergedResults);
            resetWordUi();
        },
        [
            commitResult,
            wordResults,
            currentIndex,
            queue.length,
            mergeWordResult,
            resetWordUi,
            finishSession,
            focusPracticeInput,
        ],
    );

    const handleNextFromDialog = useCallback(() => {
        setShowResultDialog(false);
        const resultToCommit = pendingResult;
        setPendingResult(null);
        if (!resultToCommit || !currentWord) return;
        advanceAfterAnswer(resultToCommit, currentWord);
    }, [pendingResult, currentWord, advanceAfterAnswer]);

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

    const checkTypedAnswer = useCallback(
        (expected: string) => {
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
            playResultSound(isCorrect);
            setShowResultDialog(true);
            inputRef.current?.blur();
        },
        [
            currentWord,
            typingResult,
            showResultDialog,
            userAnswer,
            hintsUsed,
            stageResult,
            playResultSound,
        ],
    );

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
    const handleCheckListeningAnswer = () => checkTypedAnswer(currentWord?.word ?? "");

    const handleChoiceInteraction = (
        option: string,
        submit: (selected: string) => void,
    ) => {
        if (!currentWord || typingResult) return;
        if (autoCheck) {
            submit(option);
            return;
        }
        setSelectedChoice(option);
    };

    const handleConfirmChoice = (submit: (selected: string) => void) => {
        if (selectedChoice) submit(selectedChoice);
    };

    const handleWordChoiceSelect = (selectedWord: string, correctWord: string) => {
        if (!currentWord || typingResult) return;
        const elapsed =
            wordStartTimeRef.current != null
                ? (Date.now() - wordStartTimeRef.current) / 1000
                : undefined;
        if (elapsed != null) setTimeSpentSeconds(elapsed);
        setSelectedChoice(selectedWord);
        const isCorrect = normalizeAnswer(selectedWord) === normalizeAnswer(correctWord);
        const quality = calculateAnswerQuality(isCorrect, 0, elapsed);
        stageResult({ wordId: currentWord.id, quality });
        setTypingResult(isCorrect ? "correct" : "incorrect");
        playResultSound(isCorrect);
        setShowResultDialog(true);
    };

    const handleClozeWordSelect = (selectedWord: string) => {
        handleWordChoiceSelect(selectedWord, clozePrompt?.answer ?? currentWord?.word ?? "");
    };

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
        playResultSound(isCorrect);
        setShowResultDialog(true);
    };

    const handleFlashcardRate = (rating: FlashcardRating) => {
        if (!currentWord) return;
        const result = { wordId: currentWord.id, quality: flashcardRatingToQuality(rating) };
        advanceAfterAnswer(result, currentWord);
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

    const clozeWordOptions = useMemo(() => {
        if (activeMode === "cloze" && currentWord) {
            return generateWordChoiceOptions(currentWord, queue);
        }
        return [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, activeMode, currentWord, queue]);

    const isWordChoiceMode = activeMode === "multiple-choice" || activeMode === "cloze";

    useEffect(() => {
        if (showIntro) return;
        if (["typing", "listening"].includes(activeMode)) {
            wordStartTimeRef.current = Date.now();
        }
        if (isWordChoiceMode) {
            wordStartTimeRef.current = Date.now();
        }
    }, [currentIndex, activeMode, showIntro]);

    useEffect(() => {
        if (currentWord?.audioUrl) {
            preloadAudioUrl(currentWord.audioUrl);
        }
        const nextWord = queue[currentIndex + 1];
        if (nextWord?.audioUrl) {
            preloadAudioUrl(nextWord.audioUrl);
        }
    }, [currentIndex, currentWord?.audioUrl, queue]);

    useEffect(() => {
        if (
            activeMode !== "listening" ||
            !currentWord?.audioUrl ||
            typingResult ||
            showResultDialog
        ) {
            return;
        }
        const timer = setTimeout(() => {
            playAudioUrl(currentWord.audioUrl);
            setHasPlayedAudio(true);
        }, 350);
        return () => clearTimeout(timer);
    }, [currentIndex, activeMode, currentWord?.id, currentWord?.audioUrl, typingResult, showResultDialog]);

    useEffect(() => {
        if (
            !autoCheck ||
            typingResult ||
            showResultDialog ||
            !currentWord ||
            !["typing", "listening"].includes(activeMode)
        ) {
            return;
        }
        if (activeMode === "listening" && !hasPlayedAudio) return;
        if (normalizeAnswer(userAnswer) !== normalizeAnswer(currentWord.word)) return;
        checkTypedAnswer(currentWord.word);
    }, [
        autoCheck,
        currentWord,
        activeMode,
        typingResult,
        showResultDialog,
        userAnswer,
        hasPlayedAudio,
        checkTypedAnswer,
    ]);

    useEffect(() => {
        if (showIntro) return;
        if (typingResult || showResultDialog) return;
        if (!["typing", "listening"].includes(activeMode)) return;
        focusPracticeInput();
    }, [activeMode, typingResult, showResultDialog, currentIndex, hasPlayedAudio, focusPracticeInput, showIntro]);

    useEffect(() => {
        if (
            !isWordChoiceMode ||
            typingResult ||
            showResultDialog
        ) {
            return;
        }
        const options =
            activeMode === "multiple-choice" ? multipleChoiceOptions : clozeWordOptions;
        if (options.length === 0) return;

        const onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (!["a", "b", "c", "d"].includes(key)) return;
            const target = e.target;
            if (
                target instanceof HTMLElement &&
                (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
            ) {
                return;
            }
            const index = key.charCodeAt(0) - 97;
            const option = options[index];
            if (!option) return;
            e.preventDefault();
            if (autoCheck) {
                if (activeMode === "multiple-choice") {
                    handleMultipleChoiceSelect(option);
                } else {
                    handleClozeWordSelect(option);
                }
            } else {
                setSelectedChoice(option);
            }
        };
        globalThis.addEventListener("keydown", onKeyDown);
        return () => globalThis.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        activeMode,
        isWordChoiceMode,
        typingResult,
        showResultDialog,
        multipleChoiceOptions,
        clozeWordOptions,
        currentIndex,
        autoCheck,
    ]);

    useEffect(() => {
        if (activeMode !== "flashcard" || !showAnswer) return;
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target;
            if (
                target instanceof HTMLElement &&
                (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
            ) {
                return;
            }
            const ratings: FlashcardRating[] = ["easy", "good", "hard", "forgot"];
            const index = Number.parseInt(e.key, 10) - 1;
            if (index >= 0 && index < ratings.length) {
                e.preventDefault();
                handleFlashcardRate(ratings[index]);
            }
        };
        globalThis.addEventListener("keydown", onKeyDown);
        return () => globalThis.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMode, showAnswer, currentIndex]);

    useEffect(() => {
        if (showResultDialog) {
            inputRef.current?.blur();
        }
    }, [showResultDialog]);

    if (phase === "summary" && habitState) {
        return (
            <PracticeSessionSummary
                wordResults={wordResults}
                score={scoreFromResults(wordResults)}
                habitState={habitState}
                onKeepGoing={() =>
                    onComplete?.({
                        score: scoreFromResults(wordResults),
                        wordResults,
                        habitState,
                    })
                }
                onBackToDashboard={() =>
                    onComplete?.(
                        {
                            score: scoreFromResults(wordResults),
                            wordResults,
                            habitState,
                        },
                        "/learn",
                    )
                }
            />
        );
    }

    if (!currentWord) return null;

    const newWordRoundLabel =
        currentStage === "new"
            ? ` · ${currentOccurrence + 1}/${PEDAGOGY.newWordSessionRepetitions}`
            : "";

    const inputClassName =
        "w-full px-4 py-4 text-xl text-center rounded-xl border-2 border-border bg-muted/30 focus:border-primary focus:bg-background outline-none transition-colors";

    const savableResultCount =
        wordResults.length +
        (pendingResult && !isWeakAnswer(pendingResult.quality) &&
        !wordResults.some((r) => r.wordId === pendingResult.wordId)
            ? 1
            : 0);

    // XP is presentation-only: 10 per non-weak (correct) answer recorded so far.
    const sessionXp =
        wordResults.filter((r) => !isWeakAnswer(r.quality)).length * 10;
    const skippedCount = Math.max(0, queue.length - savableResultCount);

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full">
            <div className="flex items-start gap-1 mb-4">
                <PracticeProgressHeader
                    currentIndex={currentIndex}
                    total={queue.length}
                    sessionStreak={sessionStreak}
                    mode={showIntro ? undefined : activeMode}
                    xp={sessionXp}
                    onEndSession={() => setShowEndSessionDialog(true)}
                    endSessionDisabled={showIntro || savableResultCount === 0}
                    className="flex-1 min-w-0"
                />
                <PracticeToolbar
                    showSettings={showSettings}
                    showWordsList={showWordsList}
                    queue={queue}
                    currentIndex={currentIndex}
                    onOpenSettings={() => setShowSettings(true)}
                    onCloseSettings={() => setShowSettings(false)}
                    onOpenWordsList={() => setShowWordsList(true)}
                    onCloseWordsList={() => setShowWordsList(false)}
                    hidden={showIntro}
                />
            </div>

            <ConfirmDialog
                isOpen={showEndSessionDialog}
                onClose={() => setShowEndSessionDialog(false)}
                onConfirm={handleConfirmEndSession}
                title="End session early?"
                description={`${savableResultCount} word${savableResultCount === 1 ? "" : "s"} will be saved${skippedCount > 0 ? ` · ${skippedCount} remaining will be skipped` : ""}. Your progress is kept.`}
                confirmText="End and save"
                cancelText="Keep practicing"
            />

            {isLeech && !showIntro && !showResultDialog && (
                <LeechWordBanner
                    example={rawExamples[0]}
                    audioUrl={currentWord.audioUrl}
                />
            )}

            {showIntro ? (
                <NewWordIntroPanel word={currentWord} onStartExercise={startExercise} />
            ) : (
                <PracticeCardShell variant={showResultDialog ? "result" : "default"}>
                    {showResultDialog && activeMode !== "flashcard" ? (
                        <PracticeResultPanel
                            isCorrect={typingResult === "correct"}
                            userAnswer={isWordChoiceMode ? (selectedChoice ?? "") : userAnswer}
                            correctAnswer={
                                activeMode === "cloze"
                                    ? (clozePrompt?.answer ?? currentWord.word)
                                    : currentWord.word
                            }
                            meaning={currentWord.meaning}
                            pronunciation={currentWord.pronunciation}
                            partOfSpeech={currentWord.partOfSpeech}
                            audioUrl={currentWord.audioUrl}
                            imageUrl={currentWord.imageUrl}
                            examples={rawExamples}
                            timeSpentSeconds={timeSpentSeconds}
                            feedbackSeed={feedbackSeed + currentIndex}
                            onNext={handleNextFromDialog}
                            isLastWord={
                                typingResult === "correct" && currentIndex === queue.length - 1
                            }
                        />
                    ) : (
                        <>
                            {activeMode !== "flashcard" && (
                                <PracticeExerciseHeader
                                    mode={activeMode}
                                    stage={currentStage}
                                    roundLabel={newWordRoundLabel || undefined}
                                />
                            )}
                            <PracticeExerciseBody>
                                {activeMode === "flashcard" && (
                                    <>
                                        <PracticeExerciseHeader
                                            mode="flashcard"
                                            stage={currentStage}
                                        />
                                        <div className="space-y-4 sm:space-y-6 text-center">
                                            <div>
                                                <div className="flex flex-wrap items-center justify-center gap-3 mb-3 max-w-full">
                                                    <AdaptiveText
                                                        text={currentWord.word}
                                                        role="word"
                                                        as="h2"
                                                        align="center"
                                                    />
                                                    {currentWord.audioUrl && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => playAudioUrl(currentWord.audioUrl)}
                                                            className="rounded-xl shrink-0"
                                                        >
                                                            <Volume2 className="h-5 w-5" />
                                                        </Button>
                                                    )}
                                                </div>
                                                {currentWord.pronunciation && (
                                                    <p className={`text-muted-foreground text-lg mb-2 ${LONG_TEXT_WRAP}`}>
                                                        {currentWord.pronunciation}
                                                    </p>
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
                                                <div className="pt-4 border-t border-dashed border-border animate-in fade-in">
                                                    <AdaptiveText
                                                        text={currentWord.meaning}
                                                        role="meaning"
                                                        align="center"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-6">
                                            {!showAnswer ? (
                                                <div className="flex justify-center">
                                                    <Button
                                                        size="lg"
                                                        onClick={() => {
                                                            setShowAnswer(true);
                                                            if (currentWord.audioUrl) {
                                                                setTimeout(
                                                                    () => playAudioUrl(currentWord.audioUrl),
                                                                    300,
                                                                );
                                                            }
                                                        }}
                                                        className="rounded-xl min-w-[180px]"
                                                    >
                                                        Reveal meaning
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 animate-in fade-in">
                                                    <p className="text-sm text-muted-foreground text-center">
                                                        How well did you know it?
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleFlashcardRate("easy")}
                                                            className="rounded-xl border-green-200 text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:border-green-800/50 dark:text-green-400"
                                                        >
                                                            Easy <span className="text-xs opacity-70 ml-1">1</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleFlashcardRate("good")}
                                                            className="rounded-xl border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:border-teal-800/50 dark:text-teal-400"
                                                        >
                                                            Got it <span className="text-xs opacity-70 ml-1">2</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleFlashcardRate("hard")}
                                                            className="rounded-xl border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-orange-800/50 dark:text-orange-400"
                                                        >
                                                            Hard <span className="text-xs opacity-70 ml-1">3</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleFlashcardRate("forgot")}
                                                            className="rounded-xl border-red-200 text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-400"
                                                        >
                                                            Forgot <span className="text-xs opacity-70 ml-1">4</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {activeMode === "typing" && (
                                    <div className="space-y-5 text-center">
                                        <div>
                                            <AdaptiveText
                                                text={currentWord.meaning}
                                                role="meaning"
                                                align="center"
                                                className="mb-2"
                                            />
                                            {currentWord.partOfSpeech && (
                                                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                    {currentWord.partOfSpeech}
                                                </span>
                                            )}
                                            <WordPracticeHints
                                                maskedExamples={maskedExamples}
                                                imageUrl={currentWord.imageUrl}
                                                showImageHints={effectiveImageHints}
                                            />
                                        </div>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            autoFocus
                                            placeholder="Type your answer…"
                                            value={userAnswer}
                                            onChange={(e) =>
                                                setUserAnswer(String(e.target.value).toLowerCase())
                                            }
                                            onKeyDown={(e) =>
                                                submitAnswerOnEnter(e, handleCheckTypingAnswer)
                                            }
                                            className={inputClassName}
                                        />
                                        <div className="flex flex-wrap justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={handleGetHint}
                                                className="gap-2 rounded-xl"
                                            >
                                                <Lightbulb className="h-4 w-4" />
                                                Hint {hintsUsed > 0 ? `(${hintsUsed})` : ""}
                                            </Button>
                                            {!autoCheck && (
                                                <Button
                                                    onClick={handleCheckTypingAnswer}
                                                    disabled={!userAnswer.trim()}
                                                    className="rounded-xl"
                                                >
                                                    Check
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeMode === "cloze" && clozePrompt && (
                                    <div className="space-y-5">
                                        <div className="text-center">
                                            <AdaptiveText
                                                text={clozePrompt.sentence}
                                                role="sentence"
                                                align="center"
                                                className="px-2 text-foreground/90"
                                            />
                                            <WordPracticeHints
                                                maskedExamples={maskedExamples}
                                                imageUrl={currentWord.imageUrl}
                                                showImageHints={effectiveImageHints}
                                            />
                                        </div>
                                        <PracticeWordChoiceGrid
                                            options={clozeWordOptions}
                                            onSelect={(option) =>
                                                handleChoiceInteraction(option, handleClozeWordSelect)
                                            }
                                            selectedOption={!autoCheck ? selectedChoice : null}
                                            disabled={!!typingResult}
                                        />
                                        {!autoCheck && (
                                            <div className="flex justify-center">
                                                <Button
                                                    onClick={() =>
                                                        handleConfirmChoice(handleClozeWordSelect)
                                                    }
                                                    disabled={!selectedChoice || !!typingResult}
                                                    className="rounded-xl"
                                                >
                                                    Check
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeMode === "multiple-choice" && (
                                    <div className="space-y-5">
                                        <div className="text-center">
                                            <AdaptiveText
                                                text={currentWord.word}
                                                role="word"
                                                as="h2"
                                                align="center"
                                                className="mb-2"
                                            />
                                            <WordPracticeHints
                                                maskedExamples={maskedExamples}
                                                imageUrl={currentWord.imageUrl}
                                                showImageHints={effectiveImageHints}
                                            />
                                        </div>
                                        <PracticeWordChoiceGrid
                                            options={multipleChoiceOptions}
                                            onSelect={(option) =>
                                                handleChoiceInteraction(
                                                    option,
                                                    handleMultipleChoiceSelect,
                                                )
                                            }
                                            selectedOption={!autoCheck ? selectedChoice : null}
                                            disabled={typingResult !== null}
                                        />
                                        {!autoCheck && (
                                            <div className="flex justify-center">
                                                <Button
                                                    onClick={() =>
                                                        handleConfirmChoice(handleMultipleChoiceSelect)
                                                    }
                                                    disabled={!selectedChoice || typingResult !== null}
                                                    className="rounded-xl"
                                                >
                                                    Check
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeMode === "listening" && (
                                    <div className="space-y-5 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            {hasPlayedAudio ? "Type what you heard" : "Playing audio…"}
                                        </p>
                                        <Button
                                            size="lg"
                                            onClick={() => {
                                                playAudioUrl(currentWord.audioUrl);
                                                setHasPlayedAudio(true);
                                            }}
                                            disabled={!currentWord.audioUrl}
                                            className="h-16 w-16 sm:h-20 sm:w-20 rounded-full gradient-brand text-white shadow-md"
                                            aria-label="Replay audio"
                                        >
                                            {currentWord.audioUrl ? (
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
                                            onChange={(e) => setUserAnswer(e.target.value)}
                                            onKeyDown={(e) =>
                                                submitAnswerOnEnter(
                                                    e,
                                                    handleCheckListeningAnswer,
                                                    hasPlayedAudio,
                                                )
                                            }
                                            className={inputClassName}
                                        />
                                        <div className="flex justify-center gap-2 flex-wrap">
                                            <Button
                                                variant="outline"
                                                onClick={() => playAudioUrl(currentWord.audioUrl)}
                                                className="rounded-xl"
                                            >
                                                Replay
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleGetHint}
                                                disabled={!hasPlayedAudio}
                                                className="rounded-xl"
                                            >
                                                Hint
                                            </Button>
                                            {!autoCheck && (
                                                <Button
                                                    onClick={handleCheckListeningAnswer}
                                                    disabled={!userAnswer.trim() || !hasPlayedAudio}
                                                    className="rounded-xl"
                                                >
                                                    Check
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </PracticeExerciseBody>
                        </>
                    )}
                </PracticeCardShell>
            )}
        </div>
    );
}
