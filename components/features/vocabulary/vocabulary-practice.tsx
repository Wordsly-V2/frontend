"use client";

import { LeechWordBanner } from "@/components/features/vocabulary/leech-word-banner";
import { NewWordIntroPanel } from "@/components/features/vocabulary/new-word-intro-panel";
import { PracticeCardShell } from "@/components/features/vocabulary/practice-card-shell";
import { PracticeExerciseBody } from "@/components/features/vocabulary/practice-exercise-body";
import { PracticeExerciseHeader } from "@/components/features/vocabulary/practice-exercise-header";
import { PracticeResultPanel } from "@/components/features/vocabulary/practice-result-panel";
import { PracticeSessionHeader } from "@/components/features/vocabulary/practice-session-header";
import { PracticeShortcutsHint } from "@/components/features/vocabulary/practice-shortcuts-hint";
import { PracticeToolbar } from "@/components/features/vocabulary/practice-toolbar";
import { WordPracticeHints } from "@/components/features/vocabulary/word-practice-hints";
import { PracticeSessionSummary } from "@/components/features/vocabulary/practice-session-summary";
import { AdaptiveText } from "@/components/common/adaptive-text";
import { WordPill } from "@/components/common/word-pill";
import { ChoiceMode } from "@/components/features/vocabulary/modes/choice-mode";
import { ContextMode } from "@/components/features/vocabulary/modes/context-mode";
import { FlashcardMode } from "@/components/features/vocabulary/modes/flashcard-mode";
import { ListeningMode } from "@/components/features/vocabulary/modes/listening-mode";
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
import { playAudioUrl, preloadAudioUrl, stopAudio } from "@/lib/practice-audio";
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
    getAnswerMatch,
    getClozePrompt,
    getWordExamples,
    maskWordInExamples,
    normalizeAnswer,
    normalizeForHintPrefix,
    shuffleArray,
} from "@/lib/practice-utils";
import { useNewWordIntro } from "@/hooks/useNewWordIntro.hook";
import { cn } from "@/lib/utils";
import type { SessionCompletePayload, WordResult } from "@/types/practice/practice.type";
import { IWord } from "@/types/courses/courses.type";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { toast } from "sonner";

export type { SessionCompletePayload, WordResult } from "@/types/practice/practice.type";

/**
 * Merge an attempt into the session results keeping the WORST quality per word.
 * Words can appear multiple times in a session (wrong answers re-queue until
 * correct; new words get several interleaved rounds) — the recorded result must
 * reflect the weakest attempt or accuracy inflates to 100% and failed words
 * sync to the scheduler as remembered.
 */
function mergeWorstResult(results: WordResult[], result: WordResult): WordResult[] {
    const existingIndex = results.findIndex((r) => r.wordId === result.wordId);
    if (existingIndex < 0) {
        return [...results, result];
    }
    if (result.quality >= results[existingIndex].quality) {
        return results;
    }
    return results.map((r, i) => (i === existingIndex ? result : r));
}

interface VocabularyPracticeProps {
    /** All session words (used in summary). */
    words: IWord[];
    /** Progress-ordered queue; defaults to shuffled `words`. */
    practiceQueue?: IWord[];
    stagesByWordId?: Record<string, WordLearningStage>;
    sessionKind?: PracticeSessionKind;
    leechWordIds?: Set<string>;
    /** Shown in the floating session header for orientation. */
    courseName?: string;
    /** Secondary line under the course name in the session header. */
    sessionSubtitle?: string;
    /** Leave the session entirely (e.g. back to course). */
    onExit?: () => void;
    exitDisabled?: boolean;
    onComplete?: (payload: SessionCompletePayload, destination?: string) => void;
    /**
     * Submit the graded results without navigating. Fired both when the session
     * finishes and the summary appears, and when the learner leaves mid-session
     * by any route — so progress is committed right away, never deferred to a
     * manual action. Must be idempotent (may be called more than once).
     */
    onSubmitResults?: (payload: SessionCompletePayload) => void;
}

export default function VocabularyPractice({
    words,
    practiceQueue,
    stagesByWordId,
    leechWordIds,
    courseName,
    sessionSubtitle,
    onExit,
    exitDisabled = false,
    onComplete,
    onSubmitResults,
}: Readonly<VocabularyPracticeProps>) {
    const [queue, setQueue] = useState(() => practiceQueue ?? shuffleArray(words));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<"practice" | "summary">("practice");
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState("");
    const { settings: practiceSettings } = usePracticeSettings();
    const { mode, mixedModes, autoCheck, showExampleHints, showImageHints, soundEnabled } = practiceSettings;
    const [typingResult, setTypingResult] = useState<"correct" | "incorrect" | null>(null);
    const [isNearMiss, setIsNearMiss] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [showWordsList, setShowWordsList] = useState(false);
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
    // Set once the user reports they can't hear the audio. For the rest of the
    // session, every listening word falls back to a text or recognition exercise.
    const [audioFallback, setAudioFallback] = useState(false);
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
        return buildMixedModePlan(queue, stagesByWordId, {
            leechWordIds,
            enabledModes: mixedModes,
        });
    }, [mode, mixedModes, queue, stagesByWordId, leechWordIds]);
    const resolvedMode: ActivePracticeMode = currentWord
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
        : "word-bank";
    // If the user couldn't hear the audio, fall back to a non-audio exercise:
    // fill-in (cloze) when the word supports it, otherwise the word bank.
    const activeMode: ActivePracticeMode =
        resolvedMode === "listening" && audioFallback
            ? clozePrompt != null
                ? "cloze"
                : "word-bank"
            : resolvedMode;

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
            // Worst attempt wins: a word seen multiple times (retry-until-correct,
            // new-word rounds) keeps its lowest quality, so session accuracy and
            // the FSRS sync reflect what the user actually knew. Retries that go
            // better only affect the streak below, never the recorded result.
            setWordResults((prev) => mergeWorstResult(prev, result));
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
        setIsNearMiss(false);
        setHintsUsed(0);
        setSelectedChoice(null);
        setHasPlayedAudio(false);
        setTimeSpentSeconds(undefined);
        setPendingResult(null);
    }, []);

    // Guards finalizeSession so the daily habit / history is recorded exactly
    // once, even though both the summary path and the leave-the-session flush
    // may call it. Holds the payload so repeat calls return it unchanged.
    const finalizedPayloadRef = useRef<SessionCompletePayload | null>(null);

    // Record the daily habit (locally + backend) and local session history,
    // then return the completion payload. Shared by the "finished all words"
    // / "end early" summary path and the "leave the session" flush. Idempotent.
    const finalizeSession = useCallback(
        (results: WordResult[]): SessionCompletePayload => {
            if (finalizedPayloadRef.current) {
                return finalizedPayloadRef.current;
            }
            const wordCount = results.length;
            const localHabit = recordPracticeWordsLocally(wordCount);
            setWordResults(results);
            setHabitState(localHabit);

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
                        if (habit.streakFreezes > localHabit.streakFreezes) {
                            fireMiniConfetti();
                            toast.success("Streak freeze earned! ❄️", {
                                description:
                                    "It'll auto-protect your streak if you miss a day.",
                            });
                        }
                    },
                },
            );

            const payload: SessionCompletePayload = {
                score: scoreFromResults(results),
                wordResults: results,
                habitState: localHabit,
            };
            finalizedPayloadRef.current = payload;
            return payload;
        },
        [recordDailyPractice],
    );

    const finishSession = useCallback(
        (results: WordResult[]) => {
            const payload = finalizeSession(results);
            setPhase("summary");
            onSubmitResults?.(payload);
        },
        [finalizeSession, onSubmitResults],
    );

    const mergeWordResult = useCallback(
        (results: WordResult[], result: WordResult): WordResult[] =>
            mergeWorstResult(results, result),
        [],
    );

    // Submit-on-leave: whenever the learner leaves an in-progress session by
    // ANY route — the X button, the browser back button, an in-app link — the
    // engine unmounts. We flush whatever has been answered so far (record the
    // daily habit + sync word progress) so progress is never lost, regardless
    // of how they left. finalizeSession/onSubmitResults are both idempotent, so
    // this is a no-op when the session already ended via the summary.
    //
    // Latest state is mirrored into refs because the unmount cleanup runs once
    // and must not close over stale values (and must not re-fire mid-session).
    const wordResultsRef = useRef(wordResults);
    const pendingResultRef = useRef(pendingResult);
    const submitOnLeaveRef = useRef<() => void>(() => {});
    useEffect(() => {
        wordResultsRef.current = wordResults;
        pendingResultRef.current = pendingResult;
        submitOnLeaveRef.current = () => {
            let results = wordResultsRef.current;
            if (pendingResultRef.current) {
                results = mergeWordResult(results, pendingResultRef.current);
            }
            if (results.length === 0) return;
            onSubmitResults?.(finalizeSession(results));
        };
    });
    useEffect(() => () => submitOnLeaveRef.current(), []);

    const advanceAfterAnswer = useCallback(
        (result: WordResult, word: IWord) => {
            if (isWeakAnswer(result.quality)) {
                // Record the failure (first attempt wins), then re-queue the word
                // so the learner still practices it until correct.
                commitResult(result);
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

    const handleUseTextFallback = useCallback(() => {
        stopAudio();
        setAudioFallback(true);
        setUserAnswer("");
        setHintsUsed(0);
        focusPracticeInput();
    }, [focusPracticeInput]);

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
            const match = getAnswerMatch(userAnswer, expected);
            const isCorrect = match !== "wrong";
            const nearMiss = match === "near";
            const quality = calculateAnswerQuality(isCorrect, hintsUsed, elapsed, nearMiss);
            stageResult({ wordId: currentWord.id, quality });
            setTypingResult(isCorrect ? "correct" : "incorrect");
            setIsNearMiss(nearMiss);
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

    // Context and listening modes grade the same way (typed answer vs. the word).
    const handleCheckTypingAnswer = () => checkTypedAnswer(currentWord?.word ?? "");

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

    const handleWordBankSelect = (selectedWord: string) => {
        handleWordChoiceSelect(selectedWord, currentWord?.word ?? "");
    };

    const handleFlashcardRate = (rating: FlashcardRating) => {
        if (!currentWord) return;
        const result = { wordId: currentWord.id, quality: flashcardRatingToQuality(rating) };
        advanceAfterAnswer(result, currentWord);
    };

    const handleFlashcardReveal = () => {
        setShowAnswer(true);
        if (currentWord?.audioUrl) {
            setTimeout(() => playAudioUrl(currentWord.audioUrl), 300);
        }
    };

    const handleListeningPlay = () => {
        playAudioUrl(currentWord?.audioUrl);
        setHasPlayedAudio(true);
    };

    // Rotation memory: distractor texts already shown in recent questions, so
    // the same options don't keep reappearing. The word modes (word-bank/cloze)
    // share one set.
    const usedWordDistractorsRef = useRef<Set<string>>(new Set());

    const clozeWordOptions = useMemo(() => {
        if (activeMode === "cloze" && currentWord) {
            return generateWordChoiceOptions(currentWord, queue, 4, usedWordDistractorsRef.current);
        }
        return [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, activeMode, currentWord, queue]);

    const wordBankOptions = useMemo(() => {
        if (activeMode === "word-bank" && currentWord) {
            return generateWordChoiceOptions(currentWord, queue, 4, usedWordDistractorsRef.current);
        }
        return [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, activeMode, currentWord, queue]);

    const isWordChoiceMode =
        activeMode === "cloze" ||
        activeMode === "word-bank";

    useEffect(() => {
        if (showIntro) return;
        if (["listening", "context"].includes(activeMode)) {
            wordStartTimeRef.current = Date.now();
        }
        if (isWordChoiceMode) {
            wordStartTimeRef.current = Date.now();
        }
    }, [currentIndex, activeMode, showIntro, isWordChoiceMode]);

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
            !["listening", "context"].includes(activeMode)
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
        if (!["listening", "context"].includes(activeMode)) return;
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
        const options: string[] =
            activeMode === "word-bank" ? wordBankOptions : clozeWordOptions;
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
                if (activeMode === "word-bank") {
                    handleWordBankSelect(option);
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
        clozeWordOptions,
        wordBankOptions,
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
        "w-full px-4 py-4 text-xl text-center rounded-xl border-2 border-border bg-muted/30 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-[color,background-color,border-color,box-shadow]";

    // XP is presentation-only: 10 per non-weak (correct) answer recorded so far.
    const sessionXp =
        wordResults.filter((r) => !isWeakAnswer(r.quality)).length * 10;

    return (
        <div className="flex flex-col flex-1 min-h-0 w-full">
            <PracticeSessionHeader
                currentIndex={currentIndex}
                total={queue.length}
                sessionStreak={sessionStreak}
                mode={showIntro ? undefined : activeMode}
                xp={sessionXp}
                courseName={courseName}
                subtitle={sessionSubtitle}
                onExit={onExit}
                exitDisabled={exitDisabled}
                className="mb-4"
                actions={
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
                }
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
                <PracticeCardShell
                    variant={showResultDialog ? "result" : "default"}
                    className={cn(
                        // Elevated glass treatment over the ambient mesh backdrop.
                        "bg-card/80 backdrop-blur-xl shadow-xl shadow-primary/10",
                        // Unmistakable answer feedback: tinted border + glow on result.
                        showResultDialog &&
                            (typingResult === "correct"
                                ? "border-[var(--brand-success)]/50 ring-2 ring-[var(--brand-success)]/25 shadow-[color:var(--brand-success)]/20"
                                : "animate-wiggle border-destructive/50 ring-2 ring-destructive/25 shadow-destructive/20"),
                    )}
                >
                    {showResultDialog && activeMode !== "flashcard" ? (
                        <PracticeResultPanel
                            isCorrect={typingResult === "correct"}
                            isNear={isNearMiss}
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
                                    <FlashcardMode
                                        word={currentWord}
                                        stage={currentStage}
                                        showAnswer={showAnswer}
                                        maskedExamples={maskedExamples}
                                        showImageHints={effectiveImageHints}
                                        onReveal={handleFlashcardReveal}
                                        onRate={handleFlashcardRate}
                                    />
                                )}

                                {activeMode === "context" && clozePrompt && (
                                    <ContextMode
                                        word={currentWord}
                                        sentence={clozePrompt.sentence}
                                        maskedExamples={maskedExamples}
                                        showImageHints={effectiveImageHints}
                                        inputRef={inputRef}
                                        inputClassName={inputClassName}
                                        userAnswer={userAnswer}
                                        onAnswerChange={setUserAnswer}
                                        onSubmitEnter={(e) =>
                                            submitAnswerOnEnter(e, handleCheckTypingAnswer)
                                        }
                                        onHint={handleGetHint}
                                        hintsUsed={hintsUsed}
                                        autoCheck={autoCheck}
                                        onCheck={handleCheckTypingAnswer}
                                    />
                                )}

                                {activeMode === "cloze" && clozePrompt && (
                                    <ChoiceMode
                                        prompt={
                                            <>
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
                                            </>
                                        }
                                        options={clozeWordOptions}
                                        onSelect={(option) =>
                                            handleChoiceInteraction(option, handleClozeWordSelect)
                                        }
                                        selectedOption={selectedChoice}
                                        disabled={!!typingResult}
                                        autoCheck={autoCheck}
                                        onCheck={() => handleConfirmChoice(handleClozeWordSelect)}
                                        checkDisabled={!selectedChoice || !!typingResult}
                                    />
                                )}

                                {activeMode === "word-bank" && (
                                    <ChoiceMode
                                        prompt={
                                            <>
                                                <AdaptiveText
                                                    text={currentWord.meaning}
                                                    role="meaning"
                                                    align="center"
                                                    className="mb-2"
                                                />
                                                {currentWord.partOfSpeech && (
                                                    <WordPill size="md">{currentWord.partOfSpeech}</WordPill>
                                                )}
                                                <WordPracticeHints
                                                    maskedExamples={maskedExamples}
                                                    imageUrl={currentWord.imageUrl}
                                                    showImageHints={effectiveImageHints}
                                                />
                                            </>
                                        }
                                        options={wordBankOptions}
                                        onSelect={(option) =>
                                            handleChoiceInteraction(option, handleWordBankSelect)
                                        }
                                        selectedOption={selectedChoice}
                                        disabled={!!typingResult}
                                        autoCheck={autoCheck}
                                        onCheck={() => handleConfirmChoice(handleWordBankSelect)}
                                        checkDisabled={!selectedChoice || !!typingResult}
                                    />
                                )}

                                {activeMode === "listening" && (
                                    <ListeningMode
                                        audioUrl={currentWord.audioUrl}
                                        hasPlayedAudio={hasPlayedAudio}
                                        inputRef={inputRef}
                                        inputClassName={inputClassName}
                                        userAnswer={userAnswer}
                                        onAnswerChange={setUserAnswer}
                                        onSubmitEnter={(e) =>
                                            submitAnswerOnEnter(e, handleCheckTypingAnswer, hasPlayedAudio)
                                        }
                                        onPlay={handleListeningPlay}
                                        onReplay={() => playAudioUrl(currentWord.audioUrl)}
                                        onHint={handleGetHint}
                                        autoCheck={autoCheck}
                                        onCheck={handleCheckTypingAnswer}
                                        onUseTextFallback={handleUseTextFallback}
                                    />
                                )}
                            </PracticeExerciseBody>
                        </>
                    )}
                </PracticeCardShell>
            )}

            {!showIntro && !showResultDialog && (
                <PracticeShortcutsHint mode={activeMode} className="mt-4" />
            )}
        </div>
    );
}
