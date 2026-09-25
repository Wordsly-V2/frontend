"use client";

import { SaveWordToggle } from "@/components/common/save-word-toggle";
import { LeechWordBanner } from "@/components/features/vocabulary/leech-word-banner";
import { NewWordIntroPanel } from "@/components/features/vocabulary/new-word-intro-panel";
import { PracticeCardShell } from "@/components/features/vocabulary/practice-card-shell";
import { PracticeExerciseBody } from "@/components/features/vocabulary/practice-exercise-body";
import { PracticeExerciseHeader } from "@/components/features/vocabulary/practice-exercise-header";
import { PracticeResultPanel } from "@/components/features/vocabulary/practice-result-panel";
import { PracticeSessionHeader } from "@/components/features/vocabulary/practice-session-header";
import { PracticeShortcutsHint } from "@/components/features/vocabulary/practice-shortcuts-hint";
import { PracticeToolbar } from "@/components/features/vocabulary/practice-toolbar";
import { WordRevealHint } from "@/components/features/vocabulary/word-reveal-hint";
import { PracticeSessionSummary } from "@/components/features/vocabulary/practice-session-summary";
import { AdaptiveText } from "@/components/common/adaptive-text";
import { WordPill } from "@/components/common/word-pill";
import { ChoiceMode } from "@/components/features/vocabulary/modes/choice-mode";
import { ContextMode } from "@/components/features/vocabulary/modes/context-mode";
import { FlashcardMode } from "@/components/features/vocabulary/modes/flashcard-mode";
import { ListeningMode } from "@/components/features/vocabulary/modes/listening-mode";
import { SpeakingMode } from "@/components/features/vocabulary/modes/speaking-mode";
import {
    SentenceBuildMode,
    remainingTileIndices,
} from "@/components/features/vocabulary/modes/sentence-build-mode";
import {
    calculateAnswerQuality,
    calculateRecognitionAnswerQuality,
    flashcardRatingToQuality,
    isCorrectAnswer,
    isWeakAnswer,
    type FlashcardRating,
} from "@/lib/answer-quality";
import { fireMiniConfetti } from "@/lib/confetti";
import { recordPracticeWordsLocally } from "@/lib/daily-habit";
import { getLastLearnCourse } from "@/lib/learning-session";
import { recordSession } from "@/lib/session-history";
import type { IDailyHabit } from "@/types/daily-habit/daily-habit.type";
import { playAudioUrl, preloadAudioUrl, stopAudio } from "@/lib/practice-audio";
import { pickMilestoneMessage } from "@/lib/practice-feedback";
import type { PracticeSessionKind } from "@/lib/practice-session";
import { AnswerQuality, type ILevelEvent } from "@/types/word-progress/word-progress.type";
import {
    playPracticeErrorSound,
    playPracticeSuccessSound,
} from "@/lib/practice-sounds";
import { type WordLearningStage } from "@/lib/word-progress-stage";
import { PEDAGOGY, type ModeAvailability } from "@/lib/learning-pedagogy";
import { isSpeechRecognitionSupported } from "@/lib/speech-recognition";
import type { SpeechScore } from "@/lib/speech-scoring";
import {
    buildMixedModePlan,
    mixedModePlanKey,
    SELECTABLE_MIXED_PRACTICE_MODES,
    resolveActiveMode,
    wordOccurrenceAtIndex,
    type ActivePracticeMode,
    type MixedPracticeMethod,
    type PracticeMode,
} from "@/lib/practice-settings";
import { usePracticeSettings } from "@/hooks/usePracticeSettings.hook";
import {
    generateWordChoiceOptions,
    getAnswerMatch,
    getClozePrompt,
    getSentenceBuildPrompt,
    getWordExampleObjects,
    gradeSentenceBuild,
    normalizeAnswer,
    normalizeForHintPrefix,
    shuffleArray,
} from "@/lib/practice-utils";
import { useNewWordIntro } from "@/hooks/useNewWordIntro.hook";
import {
    hasShortcutModifier,
    isEditableKeyboardTarget,
} from "@/lib/keyboard-utils";
import { cn } from "@/lib/utils";
import type { SessionCompletePayload, WordResult } from "@/types/practice/practice.type";
import { IWord, IWordExample } from "@/types/courses/courses.type";
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
/**
 * Sentence-build is slow by construction — laying out ten tiles takes far
 * longer than typing one word. With the default 8s/20s thresholds every
 * correct answer would be downgraded to "correct with difficulty" and FSRS
 * would keep the word on a short interval forever.
 */
const SENTENCE_BUILD_TIME_THRESHOLDS = { fastSeconds: 25, slowSeconds: 60 };
// Speaking includes starting the mic and the recogniser's pause detection.
const SPEAKING_TIME_THRESHOLDS = { fastSeconds: 12, slowSeconds: 30 };

/**
 * Stamp the moment the grade was given.
 *
 * Applied at grading time rather than at save time so the backend can schedule
 * from when the learner actually answered — the difference matters for a long
 * session, and matters a lot for one practiced offline and synced days later.
 */
function stampReviewedAt(result: WordResult): WordResult {
    return result.reviewedAt
        ? result
        : { ...result, reviewedAt: new Date().toISOString() };
}

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
    /**
     * The server's habit row, once the answers have saved and the daily goal has
     * been recorded from the server's own per-day word counts. Replaces the
     * optimistic local row the summary first shows.
     */
    syncedHabit?: IDailyHabit | null;
    /** Server level snapshot + XP delta from the live sync (for the summary). */
    levelEvent?: ILevelEvent;
    /** Streak-bonus XP multiplier from the live sync (1 = no bonus). */
    xpMultiplier?: number;
    /** True when this session's results are queued on the device, not synced. */
    isSavedOffline?: boolean;
    /** True when this session's results could not be saved anywhere. */
    isSaveFailed?: boolean;
    /**
     * Practice as one step of something larger (a Wordsly Path lesson): no
     * summary screen (`onFinished` fires instead) and no difficult-word flag
     * (it belongs to the learner's own words).
     */
    embedded?: boolean;
    /** Called once when the last exercise is done, after `onSubmitResults`. */
    onFinished?: (payload: SessionCompletePayload) => void;
    /** Exercise methods for this session, overriding the learner's settings. */
    modes?: ActivePracticeMode[];
    /** New words already introduced elsewhere: skip their Learn card. */
    introSeenWordIds?: ReadonlySet<string>;
}

/** The learner's mode settings, or the session's own methods when it has them. */
function sessionModes(
    settingsMode: PracticeMode,
    settingsMixed: MixedPracticeMethod[],
    modes: ActivePracticeMode[] | undefined,
): { mode: PracticeMode; mixedModes: MixedPracticeMethod[] } {
    if (!modes?.length) return { mode: settingsMode, mixedModes: settingsMixed };
    const mixed = modes.filter((m): m is MixedPracticeMethod =>
        (SELECTABLE_MIXED_PRACTICE_MODES as readonly string[]).includes(m),
    );
    if (mixed.length > 1) return { mode: "mixed", mixedModes: mixed };
    return { mode: modes[0], mixedModes: settingsMixed };
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
    syncedHabit,
    levelEvent,
    xpMultiplier,
    isSavedOffline,
    isSaveFailed,
    embedded = false,
    onFinished,
    modes,
    introSeenWordIds,
}: Readonly<VocabularyPracticeProps>) {
    const [queue, setQueue] = useState(() => practiceQueue ?? shuffleArray(words));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<"practice" | "summary">("practice");
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState("");
    const { settings: practiceSettings } = usePracticeSettings();
    const { autoCheck, soundEnabled } = practiceSettings;
    const { mode, mixedModes } = sessionModes(
        practiceSettings.mode,
        practiceSettings.mixedModes,
        modes,
    );
    const [typingResult, setTypingResult] = useState<"correct" | "incorrect" | null>(null);
    const [isNearMiss, setIsNearMiss] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showResultDialog, setShowResultDialog] = useState(false);
    const [showWordsList, setShowWordsList] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
    // Sentence-build answer tray: indices into the current prompt's tiles, in
    // the order the learner placed them (indices, not text, so repeated words
    // stay independently placeable).
    const [placedTiles, setPlacedTiles] = useState<number[]>([]);
    const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
    const [wordResults, setWordResults] = useState<WordResult[]>([]);
    const [pendingResult, setPendingResult] = useState<WordResult | null>(null);
    const [sessionStreak, setSessionStreak] = useState(0);
    const [habitState, setHabitState] = useState<IDailyHabit | null>(null);
    const [timeSpentSeconds, setTimeSpentSeconds] = useState<number | undefined>(undefined);
    const [feedbackSeed] = useState(() => Date.now());
    const [introCompletedIds, setIntroCompletedIds] = useState<Set<string>>(
        () => new Set(introSeenWordIds),
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

    const clozePrompt = useMemo(
        () => (currentWord ? getClozePrompt(currentWord) : null),
        [currentWord],
    );
    const sentenceBuildPrompt = useMemo(
        () => (currentWord ? getSentenceBuildPrompt(currentWord) : null),
        [currentWord],
    );
    // Derived from the memoized prompts rather than recomputed, so the mode we
    // pick and the prompt we render always agree (both pick a random example).
    const availability: ModeAvailability = useMemo(
        () => ({
            cloze: clozePrompt != null,
            listening: Boolean(currentWord?.audioUrl),
            sentenceBuild: sentenceBuildPrompt != null,
            speaking: isSpeechRecognitionSupported(),
        }),
        [clozePrompt, currentWord?.audioUrl, sentenceBuildPrompt],
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
              availability,
              mixedModePlan?.get(
                  mixedModePlanKey(currentWord.id, currentOccurrence),
              ),
              currentIndex,
              currentStage,
          )
        : "word-bank";
    // If the user couldn't hear the audio, fall back to a text exercise:
    // listening → fill-in (cloze) when supported, else the word bank.
    let activeMode: ActivePracticeMode = resolvedMode;
    if (resolvedMode === "listening" && audioFallback) {
        activeMode = clozePrompt != null ? "cloze" : "word-bank";
    }

    // Full example objects — the result panel shows translations and per-example
    // audio, so the text-only reader would throw away exactly what it needs.
    const rawExamples = useMemo(
        () => (currentWord ? getWordExampleObjects(currentWord) : []),
        [currentWord],
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
        (rawResult: WordResult) => {
            const result = stampReviewedAt(rawResult);
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
        setPendingResult(stampReviewedAt(result));
    }, []);

    const resetWordUi = useCallback(() => {
        setShowAnswer(false);
        setUserAnswer("");
        setTypingResult(null);
        setIsNearMiss(false);
        setHintsUsed(0);
        setSelectedChoice(null);
        setPlacedTiles([]);
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
                    // Embedded practice belongs to its host (a Path lesson),
                    // not to the course the learner last opened.
                    courseName: embedded ? courseName : getLastLearnCourse()?.name,
                    words: wordCount,
                    score: scoreFromResults(results),
                    xp: results.filter((r) => !isWeakAnswer(r.quality)).length * 10,
                },
                new Date().toISOString(),
            );

            // The SERVER half of this is deliberately not here. It now runs
            // after the answers are saved (usePracticeSessionPersistence), from
            // the per-day counts the save returns, because a word counts toward
            // the goal at most once a day and only the server knows which of
            // these words were already counted earlier today. `localHabit` still
            // moves the dial instantly; `onHabitSynced` replaces it with truth.

            const payload: SessionCompletePayload = {
                score: scoreFromResults(results),
                wordResults: results,
                habitState: localHabit,
            };
            finalizedPayloadRef.current = payload;
            return payload;
        },
        [embedded, courseName],
    );

    // Swap the optimistic habit for the server's, and celebrate a freeze the
    // day's practice just earned. Lives here rather than beside the request
    // because the streak UI it feeds is this component's summary.
    // Read through a ref so the effect keys off the arriving row alone; putting
    // habitState in the deps would re-run it on the very update it performs.
    const habitStateRef = useRef<IDailyHabit | null>(null);
    habitStateRef.current = habitState;

    useEffect(() => {
        if (!syncedHabit) return;
        const previous = habitStateRef.current;
        if (previous && syncedHabit.streakFreezes > previous.streakFreezes) {
            fireMiniConfetti();
            toast.success("Streak freeze earned! ❄️", {
                description:
                    "It'll auto-protect your streak if you miss a day.",
            });
        }
        setHabitState(syncedHabit);
    }, [syncedHabit]);

    // Set when the finished session has been handed to onSubmitResults, so the
    // unmount flush below never submits it again. That flush reads the props of
    // the last render: when a host unmounts the engine in the same update that
    // finished it (embedded in a Path lesson), that render still had the
    // host's pre-save callback, and a second submit would carry a fresh
    // idempotency key — double XP, double FSRS update.
    const submittedRef = useRef(false);

    const finishSession = useCallback(
        (results: WordResult[]) => {
            const payload = finalizeSession(results);
            submittedRef.current = true;
            setPhase("summary");
            onSubmitResults?.(payload);
            onFinished?.(payload);
        },
        [finalizeSession, onSubmitResults, onFinished],
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
            if (submittedRef.current) return;
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

    // "I'm stuck" reveal (meaning + full example) gives a lot away, so treat it
    // as ≥2 hints — that caps the recorded answer quality at "correct with
    // difficulty" (calculateAnswerQuality: 0 hints→5, 1→4, ≥2→3).
    const handleRevealHint = useCallback(() => {
        setHintsUsed((h) => Math.max(h, 2));
    }, []);

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
        // Picking from shown options is recognition, so it never grades Easy.
        const quality = calculateRecognitionAnswerQuality(isCorrect, hintsUsed, elapsed);
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

    const handlePlaceTile = useCallback(
        (tileIndex: number) => {
            if (typingResult || showResultDialog) return;
            setPlacedTiles((prev) =>
                prev.includes(tileIndex) ? prev : [...prev, tileIndex],
            );
        },
        [typingResult, showResultDialog],
    );

    const handleRemoveTileAt = useCallback(
        (position: number) => {
            if (typingResult || showResultDialog) return;
            setPlacedTiles((prev) => prev.filter((_, i) => i !== position));
        },
        [typingResult, showResultDialog],
    );

    // Hint for sentence-build: rewind to the longest correct prefix, then place
    // the next right word. That both undoes a wrong guess and moves them on.
    const handleSentenceBuildHint = useCallback(() => {
        if (!sentenceBuildPrompt || typingResult || showResultDialog) return;
        const { tiles, tokens } = sentenceBuildPrompt;
        setPlacedTiles((prev) => {
            let correct = 0;
            while (correct < prev.length && tiles[prev[correct]] === tokens[correct]) {
                correct++;
            }
            const kept = prev.slice(0, correct);
            if (kept.length >= tokens.length) return kept;
            const used = new Set(kept);
            const next = tiles.findIndex(
                (text, i) => !used.has(i) && text === tokens[kept.length],
            );
            return next < 0 ? kept : [...kept, next];
        });
        setHintsUsed((h) => h + 1);
    }, [sentenceBuildPrompt, typingResult, showResultDialog]);

    const checkSentenceBuild = useCallback(() => {
        if (!currentWord || !sentenceBuildPrompt || typingResult || showResultDialog) {
            return;
        }
        const elapsed =
            wordStartTimeRef.current != null
                ? (Date.now() - wordStartTimeRef.current) / 1000
                : undefined;
        if (elapsed != null) setTimeSpentSeconds(elapsed);
        const match = gradeSentenceBuild(
            placedTiles.map((i) => sentenceBuildPrompt.tiles[i]),
            sentenceBuildPrompt.tokens,
        );
        const isCorrect = match !== "wrong";
        const nearMiss = match === "near";
        const quality = calculateAnswerQuality(
            isCorrect,
            hintsUsed,
            elapsed,
            nearMiss,
            SENTENCE_BUILD_TIME_THRESHOLDS,
        );
        stageResult({ wordId: currentWord.id, quality });
        setTypingResult(isCorrect ? "correct" : "incorrect");
        setIsNearMiss(nearMiss);
        playResultSound(isCorrect);
        setShowResultDialog(true);
    }, [
        currentWord,
        sentenceBuildPrompt,
        typingResult,
        showResultDialog,
        placedTiles,
        hintsUsed,
        stageResult,
        playResultSound,
    ]);

    // Speaking grades like a typed answer: a retry the mode allowed counts as a
    // hint, and a pass that wasn't word-perfect is a near miss (capped at 3).
    const handleSpeakingResult = useCallback(
        (score: SpeechScore, attempts: number) => {
            if (!currentWord || typingResult || showResultDialog) return;
            const elapsed =
                wordStartTimeRef.current != null
                    ? (Date.now() - wordStartTimeRef.current) / 1000
                    : undefined;
            if (elapsed != null) setTimeSpentSeconds(elapsed);
            const isCorrect = isCorrectAnswer(score.quality);
            const nearMiss = isCorrect && score.accuracy < 1;
            const quality = calculateAnswerQuality(
                isCorrect,
                hintsUsed + attempts - 1,
                elapsed,
                nearMiss,
                SPEAKING_TIME_THRESHOLDS,
            );
            stageResult({ wordId: currentWord.id, quality });
            setUserAnswer(score.heard);
            setTypingResult(isCorrect ? "correct" : "incorrect");
            setIsNearMiss(nearMiss);
            playResultSound(isCorrect);
            setShowResultDialog(true);
        },
        [currentWord, typingResult, showResultDialog, hintsUsed, stageResult, playResultSound],
    );

    // Without a recogniser the learner judges themselves, so a "right" is
    // never better than hard-won (the same cap as a hinted answer).
    const handleSpeakingSelfCheck = (saidItRight: boolean) => {
        if (!currentWord || typingResult || showResultDialog) return;
        stageResult({
            wordId: currentWord.id,
            quality: saidItRight ? AnswerQuality.CORRECT_WITH_DIFFICULTY : AnswerQuality.INCORRECT,
        });
        setUserAnswer(saidItRight ? currentWord.word : "");
        setTypingResult(saidItRight ? "correct" : "incorrect");
        playResultSound(saidItRight);
        setShowResultDialog(true);
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
        if (["listening", "context", "sentence-build", "speaking"].includes(activeMode)) {
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

    // Sentence-build auto-checks when the tray is full — there's no "typing
    // finished" signal to watch, the last tile is the submit gesture.
    useEffect(() => {
        if (
            !autoCheck ||
            activeMode !== "sentence-build" ||
            typingResult ||
            showResultDialog ||
            !sentenceBuildPrompt
        ) {
            return;
        }
        if (placedTiles.length !== sentenceBuildPrompt.tokens.length) return;
        checkSentenceBuild();
    }, [
        autoCheck,
        activeMode,
        typingResult,
        showResultDialog,
        sentenceBuildPrompt,
        placedTiles,
        checkSentenceBuild,
    ]);

    useEffect(() => {
        if (
            activeMode !== "sentence-build" ||
            showIntro ||
            typingResult ||
            showResultDialog ||
            !sentenceBuildPrompt
        ) {
            return;
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (hasShortcutModifier(e)) return;
            if (isEditableKeyboardTarget(e.target)) return;
            if (e.key === "Backspace") {
                e.preventDefault();
                setPlacedTiles((prev) => prev.slice(0, -1));
                return;
            }
            if (e.key === "Enter") {
                if (placedTiles.length === 0) return;
                e.preventDefault();
                checkSentenceBuild();
                return;
            }
            // 1–9 index into the tiles still in the bank, matching the numbers
            // rendered on them.
            const slot = Number.parseInt(e.key, 10) - 1;
            if (Number.isNaN(slot) || slot < 0) return;
            const tileIndex = remainingTileIndices(
                sentenceBuildPrompt.tiles,
                placedTiles,
            )[slot];
            if (tileIndex === undefined) return;
            e.preventDefault();
            handlePlaceTile(tileIndex);
        };
        globalThis.addEventListener("keydown", onKeyDown);
        return () => globalThis.removeEventListener("keydown", onKeyDown);
    }, [
        activeMode,
        showIntro,
        typingResult,
        showResultDialog,
        sentenceBuildPrompt,
        placedTiles,
        handlePlaceTile,
        checkSentenceBuild,
    ]);

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
            // Auto-repeat from a held key would answer again the moment the
            // next word mounts; one press is one answer.
            if (e.repeat) return;
            if (hasShortcutModifier(e)) return;
            const key = e.key.toLowerCase();
            if (!["a", "b", "c", "d"].includes(key)) return;
            if (isEditableKeyboardTarget(e.target)) return;
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
            // A held number key must not rate the next card too.
            if (e.repeat) return;
            if (hasShortcutModifier(e)) return;
            if (isEditableKeyboardTarget(e.target)) return;
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

    // Embedded: the host moves on in `onFinished`; there is no summary here.
    if (phase === "summary" && embedded) return null;

    if (phase === "summary" && habitState) {
        return (
            <PracticeSessionSummary
                wordResults={wordResults}
                score={scoreFromResults(wordResults)}
                habitState={habitState}
                levelEvent={levelEvent}
                xpMultiplier={xpMultiplier}
                isSavedOffline={isSavedOffline}
                isSaveFailed={isSaveFailed}
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

    // What the learner assembled, as a sentence, for the result panel.
    const sentenceBuildUserAnswer =
        activeMode === "sentence-build" && sentenceBuildPrompt
            ? placedTiles.map((i) => sentenceBuildPrompt.tiles[i]).join(" ")
            : null;

    // The example the current exercise was built from — sentence modes only, so
    // the result panel can replay the sentence the learner just worked on.
    let practicedExample: IWordExample | undefined;
    if (activeMode === "sentence-build") {
        practicedExample = sentenceBuildPrompt?.example;
    } else if (activeMode === "cloze" || activeMode === "context") {
        practicedExample = clozePrompt?.example;
    }

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
                    <>
                        {/* Flagging is most useful in the moment the word is
                            hard, so it sits with the session controls rather
                            than behind the words list. */}
                        {!embedded && (
                            <SaveWordToggle wordId={currentWord.id} iconOnly />
                        )}
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
                    </>
                }
            />

            {isLeech && !showIntro && !showResultDialog && (
                <LeechWordBanner
                    example={rawExamples[0]?.text}
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
                            userAnswer={sentenceBuildUserAnswer ?? (isWordChoiceMode ? (selectedChoice ?? "") : userAnswer)}
                            correctAnswer={
                                activeMode === "sentence-build" && sentenceBuildPrompt
                                    ? sentenceBuildPrompt.reference
                                    : activeMode === "cloze"
                                      ? (clozePrompt?.answer ?? currentWord.word)
                                      : currentWord.word
                            }
                            meaning={currentWord.meaning}
                            pronunciation={currentWord.pronunciation}
                            partOfSpeech={currentWord.partOfSpeech}
                            audioUrl={currentWord.audioUrl}
                            imageUrl={currentWord.imageUrl}
                            examples={rawExamples}
                            practicedExample={practicedExample}
                            practicedWord={currentWord.word}
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
                                        onReveal={handleFlashcardReveal}
                                        onRate={handleFlashcardRate}
                                    />
                                )}

                                {activeMode === "context" && clozePrompt && (
                                    <div className="space-y-4">
                                        <ContextMode
                                            word={currentWord}
                                            sentence={clozePrompt.sentence}
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
                                        <div className="text-center">
                                            <WordRevealHint
                                                word={currentWord}
                                                onReveal={handleRevealHint}
                                            />
                                        </div>
                                    </div>
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
                                                <div className="mt-3 text-center">
                                                    <WordRevealHint
                                                        word={currentWord}
                                                        onReveal={handleRevealHint}
                                                    />
                                                </div>
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
                                                <div className="mt-3 text-center">
                                                    <WordRevealHint
                                                        word={currentWord}
                                                        showMeaning={false}
                                                        onReveal={handleRevealHint}
                                                    />
                                                </div>
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

                                {activeMode === "sentence-build" && sentenceBuildPrompt && (
                                    <div className="space-y-4">
                                        <SentenceBuildMode
                                            prompt={sentenceBuildPrompt}
                                            placed={placedTiles}
                                            onPlace={handlePlaceTile}
                                            onRemoveAt={handleRemoveTileAt}
                                            onHint={handleSentenceBuildHint}
                                            hintsUsed={hintsUsed}
                                            autoCheck={autoCheck}
                                            onCheck={checkSentenceBuild}
                                        />
                                        <div className="text-center">
                                            <WordRevealHint
                                                word={currentWord}
                                                onReveal={handleRevealHint}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeMode === "speaking" && (
                                    <div className="space-y-4">
                                        <SpeakingMode
                                            key={`${currentWord.id}:${currentIndex}`}
                                            word={currentWord}
                                            onResult={handleSpeakingResult}
                                            onSelfCheck={handleSpeakingSelfCheck}
                                        />
                                        <div className="text-center">
                                            <WordRevealHint
                                                word={currentWord}
                                                showMeaning={false}
                                                onReveal={handleRevealHint}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeMode === "listening" && (
                                    <div className="space-y-4">
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
                                        <div className="text-center">
                                            <WordRevealHint
                                                word={currentWord}
                                                onReveal={handleRevealHint}
                                            />
                                        </div>
                                    </div>
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
