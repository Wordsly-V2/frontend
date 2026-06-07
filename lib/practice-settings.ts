import { getLocalStorageItem } from "@/lib/local-storage";
import { assignMixedPracticeMode } from "@/lib/learning-pedagogy";
import { shuffleArray } from "@/lib/practice-utils";
import type { PracticeSettings } from "@/components/features/vocabulary/practice-settings-dialog";
import type { PracticeSessionKind } from "@/lib/practice-session";
import type { WordLearningStage } from "@/lib/word-progress-stage";
import type { IWord } from "@/types/courses/courses.type";

export const SETTINGS_STORAGE_KEY = "vocabulary-practice-settings";

export const DEFAULT_PRACTICE_SETTINGS: PracticeSettings = {
    mode: "mixed",
    autoCheck: true,
    showExampleHints: false,
    showImageHints: false,
    soundEnabled: false,
};

const SESSION_OVERRIDES: Record<PracticeSessionKind, Partial<PracticeSettings>> = {
    new: {
        mode: "mixed",
        showExampleHints: true,
        showImageHints: true,
    },
    review: {
        mode: "mixed",
        showExampleHints: false,
        showImageHints: false,
    },
};

export function parsePracticeSettings(raw: string | null, initial: PracticeSettings): PracticeSettings {
    if (raw === null) return initial;
    try {
        const parsed = JSON.parse(raw) as Partial<PracticeSettings>;
        return {
            mode: parsed.mode ?? initial.mode,
            autoCheck: parsed.autoCheck ?? initial.autoCheck,
            showExampleHints: parsed.showExampleHints ?? initial.showExampleHints,
            showImageHints: parsed.showImageHints ?? initial.showImageHints,
            soundEnabled: parsed.soundEnabled ?? initial.soundEnabled,
        };
    } catch {
        return initial;
    }
}

export function readPracticeSettingsFromStorage(): PracticeSettings {
    const raw = getLocalStorageItem(SETTINGS_STORAGE_KEY);
    return parsePracticeSettings(raw, DEFAULT_PRACTICE_SETTINGS);
}

export function resolvePracticeSettings(
    sessionKind: PracticeSessionKind,
    stored?: PracticeSettings,
): PracticeSettings {
    const base = stored ?? readPracticeSettingsFromStorage();
    const override = SESSION_OVERRIDES[sessionKind];
    return { ...base, ...override };
}

/** Modes available in mixed sessions. */
export const MIXED_PRACTICE_MODES = ["typing", "listening", "multiple-choice", "cloze"] as const;

export const NEW_WORD_MIXED_MODES = ["typing", "multiple-choice", "cloze"] as const;
export const LEARNING_MIXED_MODES = ["typing", "listening", "multiple-choice", "cloze"] as const;
export const REVIEW_MIXED_MODES = ["typing", "listening", "cloze", "multiple-choice"] as const;

export type ActivePracticeMode =
    | (typeof MIXED_PRACTICE_MODES)[number]
    | (typeof NEW_WORD_MIXED_MODES)[number]
    | "flashcard";

function mixedModesForStage(stage: WordLearningStage): readonly string[] {
    switch (stage) {
        case "new":
            return NEW_WORD_MIXED_MODES;
        case "learning":
            return LEARNING_MIXED_MODES;
        case "due":
        case "review":
            return REVIEW_MIXED_MODES;
    }
}

function resolveClozeFallback(listeningAvailable: boolean): ActivePracticeMode {
    return listeningAvailable ? "listening" : "typing";
}

function applyModeFallbacks(
    mode: ActivePracticeMode,
    clozeAvailable: boolean,
    listeningAvailable: boolean,
): ActivePracticeMode {
    if (mode === "cloze" && !clozeAvailable) {
        return resolveClozeFallback(listeningAvailable);
    }
    return mode;
}

/** Key for one queue slot (same word can appear multiple times). */
export function mixedModePlanKey(wordId: string, occurrence: number): string {
    return `${wordId}:${occurrence}`;
}

/** 0-based occurrence of queue[index] among same wordId earlier in the queue. */
export function wordOccurrenceAtIndex(queue: IWord[], index: number): number {
    const wordId = queue[index]?.id;
    if (!wordId) return 0;
    let count = 0;
    for (let i = 0; i <= index; i++) {
        if (queue[i].id === wordId) count++;
    }
    return count - 1;
}

export interface MixedModePlanOptions {
    leechWordIds?: Set<string>;
    /** Retry pass uses the opposite recall direction (interleaving). */
    retryPass?: boolean;
    previousPlan?: Map<string, ActivePracticeMode>;
}

/** Assign an evidence-based practice method to each word in a mixed session. */
export function buildMixedModePlan(
    queue: IWord[],
    stagesByWordId?: Record<string, WordLearningStage>,
    options?: MixedModePlanOptions,
): Map<string, ActivePracticeMode> {
    const { leechWordIds, retryPass = false, previousPlan } = options ?? {};
    const plan = new Map<string, ActivePracticeMode>();
    let preferProduction = shuffleArray([true, false])[0];
    const occurrenceByWordId = new Map<string, number>();

    for (let queueIndex = 0; queueIndex < queue.length; queueIndex++) {
        const word = queue[queueIndex];
        const stage = stagesByWordId?.[word.id] ?? "new";
        const allowed = new Set(mixedModesForStage(stage));
        const newWordRound = occurrenceByWordId.get(word.id) ?? 0;
        occurrenceByWordId.set(word.id, newWordRound + 1);

        const planKey = `${word.id}:${newWordRound}`;
        const { mode, nextPreferProduction } = assignMixedPracticeMode({
            word,
            stage,
            allowed,
            isLeech: leechWordIds?.has(word.id) ?? false,
            preferProduction,
            retryPass,
            previousMode: previousPlan?.get(planKey) ?? previousPlan?.get(word.id),
            newWordRound: stage === "new" ? newWordRound : undefined,
            modeSlotIndex: queueIndex,
        });
        plan.set(planKey, mode);
        preferProduction = nextPreferProduction;
    }

    return plan;
}

export function resolveActiveMode(
    settingsMode: PracticeSettings["mode"],
    clozeAvailable: boolean,
    listeningAvailable = true,
    assignedMixedMode?: ActivePracticeMode,
    fallbackIndex = 0,
    fallbackStage: WordLearningStage = "learning",
): ActivePracticeMode {
    if (settingsMode === "mixed") {
        const modes = mixedModesForStage(fallbackStage);
        const mode =
            assignedMixedMode ??
            (modes[fallbackIndex % modes.length] as ActivePracticeMode);
        return applyModeFallbacks(mode, clozeAvailable, listeningAvailable);
    }
    if (settingsMode === "cloze" && !clozeAvailable) {
        return resolveClozeFallback(listeningAvailable);
    }
    return settingsMode;
}
