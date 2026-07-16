import { getLocalStorageItem } from "@/lib/local-storage";
import { WORD_DETAILS_AUTO_NEXT_STORAGE_KEY } from "@/lib/user-local-data";
import type { IWordDetailsAutoNext } from "@/types/preferences/preferences.type";

export const DELAY_BETWEEN_WORDS_MIN_SEC = 1;
export const DELAY_BETWEEN_WORDS_MAX_SEC = 600;
export const DELAY_BETWEEN_WORDS_DEFAULT_SEC = 5;

export const DEFAULT_WORD_DETAILS_AUTO_NEXT: IWordDetailsAutoNext = {
    enabled: false,
    delaySec: DELAY_BETWEEN_WORDS_DEFAULT_SEC,
};

export function clampDelayBetweenWordsSec(value: number): number {
    if (!Number.isFinite(value)) return DELAY_BETWEEN_WORDS_DEFAULT_SEC;
    return Math.min(
        DELAY_BETWEEN_WORDS_MAX_SEC,
        Math.max(DELAY_BETWEEN_WORDS_MIN_SEC, Math.round(value)),
    );
}

/** Tolerate legacy boolean values and clamp the delay to the allowed range. */
export function parseWordDetailsAutoNext(
    raw: string | null,
    initial: IWordDetailsAutoNext,
): IWordDetailsAutoNext {
    if (raw === null) return initial;
    try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed === true || parsed === false) {
            return { enabled: parsed, delaySec: DELAY_BETWEEN_WORDS_DEFAULT_SEC };
        }
        if (parsed && typeof parsed === "object" && "enabled" in parsed) {
            const enabled = (parsed as { enabled?: unknown }).enabled;
            const rawDelay = (parsed as { delaySec?: unknown }).delaySec;
            if (typeof enabled === "boolean") {
                const delaySec =
                    typeof rawDelay === "number"
                        ? clampDelayBetweenWordsSec(rawDelay)
                        : DELAY_BETWEEN_WORDS_DEFAULT_SEC;
                return { enabled, delaySec };
            }
        }
        return initial;
    } catch {
        return initial;
    }
}

/** Read the persisted auto-next preference synchronously (safe for SSR). */
export function readWordDetailsAutoNextFromStorage(): IWordDetailsAutoNext {
    if (globalThis.window === undefined) return DEFAULT_WORD_DETAILS_AUTO_NEXT;
    return parseWordDetailsAutoNext(
        getLocalStorageItem(WORD_DETAILS_AUTO_NEXT_STORAGE_KEY),
        DEFAULT_WORD_DETAILS_AUTO_NEXT,
    );
}
