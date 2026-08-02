import { getLocalStorageItem } from '@/lib/local-storage';
import {
    assignMixedPracticeMode,
    type ModeAvailability,
} from '@/lib/learning-pedagogy';
import { shuffleArray } from '@/lib/practice-utils';
import type { WordLearningStage } from '@/lib/word-progress-stage';
import type { IWord } from '@/types/courses/courses.type';

// Bumped when a new mix method ships. Stored settings enumerate the methods
// that existed when they were saved, so reading an old blob under the current
// key would silently opt every existing user out of the new method forever.
export const SETTINGS_STORAGE_KEY = 'vocabulary-practice-settings.v2';

// Older keys, newest first. Read (once, to migrate) and cleared on logout.
export const LEGACY_SETTINGS_STORAGE_KEYS: readonly string[] = [
    'vocabulary-practice-settings',
];

// The mix methods that existed under `vocabulary-practice-settings`. A stored
// list equal to this set means "the user never deselected anything", so the
// migration opts them into the new methods too instead of freezing their mix.
const V1_MIXED_PRACTICE_MODES: readonly string[] = [
    'listening',
    'context',
    'word-bank',
    'cloze',
];

/** Concrete methods a user can opt in/out of within a mixed session. */
export const MIXED_PRACTICE_MODES = [
    'listening',
    'context',
    'word-bank',
    'cloze',
    'sentence-build',
] as const;

export type MixedPracticeMethod = (typeof MIXED_PRACTICE_MODES)[number];

/** Every selectable practice mode (concrete methods + the meta "mixed" mode). */
export type PracticeMode =
    | 'flashcard'
    | 'context'
    | 'word-bank'
    | 'listening'
    | 'cloze'
    | 'sentence-build'
    | 'mixed';

export interface PracticeSettings {
    mode: PracticeMode;
    /** Which methods the mixed mode may rotate through. Empty = all. */
    mixedModes: MixedPracticeMethod[];
    autoCheck: boolean;
    soundEnabled: boolean;
}

export const DEFAULT_PRACTICE_SETTINGS: PracticeSettings = {
    mode: 'mixed',
    mixedModes: [...MIXED_PRACTICE_MODES],
    autoCheck: true,
    soundEnabled: false,
};

/** Every selectable practice mode (concrete methods + meta modes). */
const VALID_PRACTICE_MODES = new Set<string>([
    ...MIXED_PRACTICE_MODES,
    'flashcard',
    'mixed',
]);

/** Coerce an unknown stored mode to a valid one (e.g. drop legacy 'typing'). */
function parsePracticeMode(
    value: unknown,
    fallback: PracticeSettings['mode'],
): PracticeSettings['mode'] {
    return typeof value === 'string' && VALID_PRACTICE_MODES.has(value)
        ? (value as PracticeSettings['mode'])
        : fallback;
}

/** Keep only valid, de-duplicated mix methods; empty/invalid falls back to all. */
function parseMixedModes(
    value: unknown,
    fallback: MixedPracticeMethod[],
): MixedPracticeMethod[] {
    if (!Array.isArray(value)) return fallback;
    const valid = new Set<string>(MIXED_PRACTICE_MODES);
    const picked = MIXED_PRACTICE_MODES.filter(
        (mode) => value.includes(mode) && valid.has(mode),
    );
    return picked.length > 0 ? [...picked] : fallback;
}

export function parsePracticeSettings(
    raw: string | null,
    initial: PracticeSettings,
    opts?: {
        /** Ignore the stored mix list and enable every method (migration only). */
        forceAllMixedModes?: boolean;
    },
): PracticeSettings {
    if (raw === null) return initial;
    try {
        const parsed = JSON.parse(raw) as Partial<PracticeSettings>;
        return {
            mode: parsePracticeMode(parsed.mode, initial.mode),
            mixedModes: opts?.forceAllMixedModes
                ? [...MIXED_PRACTICE_MODES]
                : parseMixedModes(parsed.mixedModes, initial.mixedModes),
            autoCheck: parsed.autoCheck ?? initial.autoCheck,
            soundEnabled: parsed.soundEnabled ?? initial.soundEnabled,
        };
    } catch {
        return initial;
    }
}

/**
 * Carry a pre-v2 blob forward. Everything but the mix list transfers verbatim;
 * a mix list that was simply "all of v1" becomes "all of v2" so the learner
 * gets the new methods, while a deliberately narrowed list is respected.
 */
function migrateLegacySettings(raw: string): PracticeSettings {
    let storedMix: unknown;
    try {
        storedMix = (JSON.parse(raw) as Partial<PracticeSettings>).mixedModes;
    } catch {
        return DEFAULT_PRACTICE_SETTINGS;
    }
    const wasAllOfV1 =
        Array.isArray(storedMix) &&
        V1_MIXED_PRACTICE_MODES.every((m) => storedMix.includes(m));
    return parsePracticeSettings(raw, DEFAULT_PRACTICE_SETTINGS, {
        forceAllMixedModes: wasAllOfV1,
    });
}

export function readPracticeSettingsFromStorage(): PracticeSettings {
    const raw = getLocalStorageItem(SETTINGS_STORAGE_KEY);
    if (raw !== null) return parsePracticeSettings(raw, DEFAULT_PRACTICE_SETTINGS);

    for (const key of LEGACY_SETTINGS_STORAGE_KEYS) {
        const legacy = getLocalStorageItem(key);
        if (legacy !== null) return migrateLegacySettings(legacy);
    }
    return DEFAULT_PRACTICE_SETTINGS;
}

export const NEW_WORD_MIXED_MODES = [
    'context',
    'word-bank',
    'cloze',
] as const;
export const LEARNING_MIXED_MODES = [
    'listening',
    'context',
    'word-bank',
    'cloze',
    'sentence-build',
] as const;
export const REVIEW_MIXED_MODES = [
    'listening',
    'context',
    'cloze',
    'word-bank',
    'sentence-build',
] as const;

export type ActivePracticeMode =
    | (typeof MIXED_PRACTICE_MODES)[number]
    | (typeof NEW_WORD_MIXED_MODES)[number]
    | 'flashcard';

function mixedModesForStage(stage: WordLearningStage): readonly string[] {
    switch (stage) {
        case 'new':
            return NEW_WORD_MIXED_MODES;
        case 'learning':
            return LEARNING_MIXED_MODES;
        case 'due':
        case 'review':
            return REVIEW_MIXED_MODES;
    }
}

function resolveClozeFallback(availability: ModeAvailability): ActivePracticeMode {
    // Sentence-based modes need an example; without one fall back to listening
    // when there's audio, otherwise the word-bank exercise (always renderable).
    return availability.listening ? 'listening' : 'word-bank';
}

function applyModeFallbacks(
    mode: ActivePracticeMode,
    availability: ModeAvailability,
): ActivePracticeMode {
    // Cloze (pick word in a sentence) and context (type word in a sentence)
    // both need an example; fall back when the word has none.
    if ((mode === 'cloze' || mode === 'context') && !availability.cloze) {
        return resolveClozeFallback(availability);
    }
    // Sentence-build needs a *translated* example — much rarer than a plain
    // one, so step down to the typed cloze before giving up on the sentence.
    if (mode === 'sentence-build' && !availability.sentenceBuild) {
        return availability.cloze ? 'context' : resolveClozeFallback(availability);
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
    /** Restrict the mix to these methods (user choice). Empty/undefined = all. */
    enabledModes?: readonly string[];
}

/** Assign an evidence-based practice method to each word in a mixed session. */
export function buildMixedModePlan(
    queue: IWord[],
    stagesByWordId?: Record<string, WordLearningStage>,
    options?: MixedModePlanOptions,
): Map<string, ActivePracticeMode> {
    const { leechWordIds, enabledModes } = options ?? {};
    const enabled =
        enabledModes && enabledModes.length > 0 ? new Set(enabledModes) : null;
    const plan = new Map<string, ActivePracticeMode>();
    let preferProduction = shuffleArray([true, false])[0];
    let productionSlotIndex = 0;
    let recognitionSlotIndex = 0;
    const occurrenceByWordId = new Map<string, number>();

    for (const word of queue) {
        const stage = stagesByWordId?.[word.id] ?? 'new';
        let allowed = new Set(mixedModesForStage(stage));
        if (enabled) {
            // Keep only the methods the user opted into. If the intersection is
            // empty for this stage, keep the full stage pool so the word still
            // gets a usable exercise rather than being dropped.
            const restricted = new Set(
                [...allowed].filter((mode) => enabled.has(mode)),
            );
            if (restricted.size > 0) allowed = restricted;
        }
        const newWordRound = occurrenceByWordId.get(word.id) ?? 0;
        occurrenceByWordId.set(word.id, newWordRound + 1);

        const planKey = `${word.id}:${newWordRound}`;
        const { mode, nextPreferProduction, poolUsed } = assignMixedPracticeMode({
            word,
            stage,
            allowed,
            isLeech: leechWordIds?.has(word.id) ?? false,
            preferProduction,
            newWordRound: stage === 'new' ? newWordRound : undefined,
            productionSlotIndex,
            recognitionSlotIndex,
        });
        plan.set(planKey, mode);
        preferProduction = nextPreferProduction;
        if (poolUsed === 'production') productionSlotIndex++;
        else if (poolUsed === 'recognition') recognitionSlotIndex++;
    }

    return plan;
}

export function resolveActiveMode(
    settingsMode: PracticeSettings['mode'],
    availability: ModeAvailability,
    assignedMixedMode?: ActivePracticeMode,
    fallbackIndex = 0,
    fallbackStage: WordLearningStage = 'learning',
): ActivePracticeMode {
    if (settingsMode === 'mixed') {
        const modes = mixedModesForStage(fallbackStage);
        const mode =
            assignedMixedMode ??
            (modes[fallbackIndex % modes.length] as ActivePracticeMode);
        return applyModeFallbacks(mode, availability);
    }
    // A directly chosen mode still has to be renderable for this word.
    return applyModeFallbacks(settingsMode, availability);
}
