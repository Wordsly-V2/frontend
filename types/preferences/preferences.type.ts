import type { PracticeSettings } from "@/lib/practice-settings";

/** Word-details carousel auto-advance preference. */
export interface IWordDetailsAutoNext {
    enabled: boolean;
    delaySec: number;
}

/**
 * The synced preferences blob. Every slice is optional so a partial patch can
 * be sent (last-write-wins per key on the server) and older clients tolerate
 * keys they don't know about.
 */
export interface IAppPreferences {
    practice?: PracticeSettings;
    dueWordsLimit?: number;
    wordDetailsAutoNext?: IWordDetailsAutoNext;
    /** next-themes value: "light" | "dark" | "system". */
    theme?: string;
}

/** GET/PATCH /preferences response envelope. */
export interface IPreferencesResponse {
    preferences: IAppPreferences;
}
