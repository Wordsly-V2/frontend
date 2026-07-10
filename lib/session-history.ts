/**
 * Lightweight local session history (no backend). Appended on session finish,
 * surfaced on the profile page. Capped to the most recent entries.
 */
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/local-storage";

export const SESSION_HISTORY_KEY = "wordsly.sessionHistory";
const MAX_ENTRIES = 30;

export type SessionHistoryEntry = {
    /** ISO timestamp. */
    at: string;
    courseName?: string;
    words: number;
    score: number;
    xp: number;
};

export function getSessionHistory(): SessionHistoryEntry[] {
    const raw = getLocalStorageItem(SESSION_HISTORY_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as SessionHistoryEntry[]) : [];
    } catch {
        return [];
    }
}

// Stable-reference snapshot for useSyncExternalStore — only re-parses when the
// underlying localStorage string actually changes, so getSnapshot stays cached.
let snapshotRaw: string | null = null;
let snapshotValue: SessionHistoryEntry[] = [];

export function getSessionHistorySnapshot(): SessionHistoryEntry[] {
    if (globalThis.window === undefined) return snapshotValue;
    const raw = getLocalStorageItem(SESSION_HISTORY_KEY);
    if (raw !== snapshotRaw) {
        snapshotRaw = raw;
        snapshotValue = getSessionHistory();
    }
    return snapshotValue;
}

export function recordSession(
    entry: Omit<SessionHistoryEntry, "at">,
    at: string,
): void {
    const history = getSessionHistory();
    const updated = [{ at, ...entry }, ...history].slice(0, MAX_ENTRIES);
    setLocalStorageItem(SESSION_HISTORY_KEY, JSON.stringify(updated));
}
