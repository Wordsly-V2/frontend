"use client";

import { setLocalStorageItem } from "@/lib/local-storage";
import { emitPreferenceChange } from "@/lib/preferences-sync";
import { WORD_DETAILS_AUTO_NEXT_STORAGE_KEY } from "@/lib/user-local-data";
import {
    clampDelayBetweenWordsSec,
    DEFAULT_WORD_DETAILS_AUTO_NEXT,
    readWordDetailsAutoNextFromStorage,
} from "@/lib/word-details-auto-next";
import type { IWordDetailsAutoNext } from "@/types/preferences/preferences.type";
import { useSyncExternalStore } from "react";

/**
 * Single source of truth for the word-details carousel auto-advance preference.
 * Module-level store persisted to localStorage and synced across devices, in
 * the same shape as usePracticeSettings / useDueWordsLimit.
 */
let store: IWordDetailsAutoNext | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): IWordDetailsAutoNext {
    if (store === null) store = readWordDetailsAutoNextFromStorage();
    return store;
}

function getServerSnapshot(): IWordDetailsAutoNext {
    return DEFAULT_WORD_DETAILS_AUTO_NEXT;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Update the auto-next preference, persist, sync, and notify all consumers. */
export function setWordDetailsAutoNext(next: IWordDetailsAutoNext): void {
    const normalized: IWordDetailsAutoNext = {
        enabled: next.enabled,
        delaySec: clampDelayBetweenWordsSec(next.delaySec),
    };
    store = normalized;
    setLocalStorageItem(
        WORD_DETAILS_AUTO_NEXT_STORAGE_KEY,
        JSON.stringify(normalized),
    );
    emitPreferenceChange({ wordDetailsAutoNext: normalized });
    for (const listener of listeners) listener();
}

export function useWordDetailsAutoNext(): {
    autoNext: IWordDetailsAutoNext;
    setAutoNext: (next: IWordDetailsAutoNext) => void;
} {
    const autoNext = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    return { autoNext, setAutoNext: setWordDetailsAutoNext };
}
