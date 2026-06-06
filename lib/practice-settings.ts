import { getLocalStorageItem } from "@/lib/local-storage";
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

/** Assign a shuffled practice method to each word in a mixed session. */
export function buildMixedModePlan(
    queue: IWord[],
    stagesByWordId?: Record<string, WordLearningStage>,
): Map<string, ActivePracticeMode> {
    const ring = shuffleArray([...MIXED_PRACTICE_MODES]) as ActivePracticeMode[];
    let ringIndex = 0;
    const plan = new Map<string, ActivePracticeMode>();

    for (const word of queue) {
        const stage = stagesByWordId?.[word.id] ?? "new";
        const allowed = new Set(mixedModesForStage(stage));
        let assigned: ActivePracticeMode | null = null;

        for (let attempt = 0; attempt < ring.length; attempt++) {
            const candidate = ring[ringIndex % ring.length];
            ringIndex++;
            if (allowed.has(candidate)) {
                assigned = candidate;
                break;
            }
        }

        if (!assigned) {
            assigned = shuffleArray([...mixedModesForStage(stage)])[0] as ActivePracticeMode;
        }

        plan.set(word.id, assigned);
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
