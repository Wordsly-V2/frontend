import { getLocalStorageItem } from "@/lib/local-storage";
import type { PracticeSettings } from "@/components/features/vocabulary/practice-settings-dialog";
import type { PracticeSessionKind } from "@/lib/practice-session";

export const SETTINGS_STORAGE_KEY = "vocabulary-practice-settings";

export const DEFAULT_PRACTICE_SETTINGS: PracticeSettings = {
    mode: "mixed",
    autoCheck: true,
    showExampleHints: false,
    showImageHints: false,
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

/** Modes cycled in mixed sessions — strongest recall patterns first. */
export const MIXED_PRACTICE_MODES = ["typing", "listening", "multiple-choice", "cloze"] as const;

export type ActivePracticeMode = (typeof MIXED_PRACTICE_MODES)[number] | "flashcard";

export function resolveActiveMode(
    settingsMode: PracticeSettings["mode"],
    wordIndex: number,
    clozeAvailable: boolean,
): ActivePracticeMode {
    if (settingsMode === "mixed") {
        const mode = MIXED_PRACTICE_MODES[wordIndex % MIXED_PRACTICE_MODES.length];
        if (mode === "cloze" && !clozeAvailable) return "typing";
        return mode;
    }
    if (settingsMode === "cloze" && !clozeAvailable) return "typing";
    return settingsMode;
}
