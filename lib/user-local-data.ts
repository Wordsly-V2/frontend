import {
    ACCESS_TOKEN_STORAGE_KEY,
    REFRESH_TOKEN_STORAGE_KEY,
    removeLocalStorageItem,
} from "@/lib/local-storage";
import { PENDING_SAVES_KEY } from "@/lib/practice-pending-saves";
import { SETTINGS_STORAGE_KEY } from "@/lib/practice-settings";
import { SESSION_HISTORY_KEY } from "@/lib/session-history";
import { DUE_WORDS_LIMIT_STORAGE_KEY } from "@/lib/due-words-limit";
import { DAILY_HABIT_STORAGE_KEY } from "@/lib/daily-habit";
import { LAST_LEARN_COURSE_KEY } from "@/lib/learning-session";
import { LAST_MANAGE_COURSE_KEY } from "@/lib/manage-session";

// Preference key owned by the word-details carousel. Defined here (and imported by
// the component) so it lives in a lib module and can be cleared on logout without a
// lib → component import inversion.
export const WORD_DETAILS_AUTO_NEXT_STORAGE_KEY = "wordsly.wordDetails.autoNext";

// Every user-scoped localStorage key, wiped on logout so nothing leaks to the next
// user on a shared browser. `theme` is intentionally NOT included — it's a device
// preference managed by next-themes, not user data.
const USER_DATA_KEYS: readonly string[] = [
    ACCESS_TOKEN_STORAGE_KEY,
    REFRESH_TOKEN_STORAGE_KEY,
    PENDING_SAVES_KEY,
    SETTINGS_STORAGE_KEY,
    SESSION_HISTORY_KEY,
    DUE_WORDS_LIMIT_STORAGE_KEY,
    DAILY_HABIT_STORAGE_KEY,
    LAST_LEARN_COURSE_KEY,
    LAST_MANAGE_COURSE_KEY,
    WORD_DETAILS_AUTO_NEXT_STORAGE_KEY,
];

/** Remove all user-specific data from localStorage. Call on logout. */
export function clearUserLocalData(): void {
    for (const key of USER_DATA_KEYS) {
        removeLocalStorageItem(key);
    }
}
