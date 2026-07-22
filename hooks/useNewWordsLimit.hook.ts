"use client";

import {
    DEFAULT_NEW_WORDS_LIMIT,
    NEW_WORDS_LIMIT_STORAGE_KEY,
    readNewWordsLimitFromStorage,
} from "@/lib/due-words-limit";
import { setLocalStorageItem } from "@/lib/local-storage";
import { emitPreferenceChange } from "@/lib/preferences-sync";
import { useSyncExternalStore } from "react";

/**
 * Single source of truth for the "words per new-words session" batch size —
 * how many never-studied words a learn-new session introduces. Kept separate
 * from the review batch size (useDueWordsLimit) so the two can differ.
 *
 * A module-level store keeps every consumer in sync without prop-drilling and
 * persists to localStorage. Mirrors useDueWordsLimit.
 */
let store: number | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): number {
    if (store === null) store = readNewWordsLimitFromStorage();
    return store;
}

function getServerSnapshot(): number {
    return DEFAULT_NEW_WORDS_LIMIT;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Update the limit, persist, and notify all consumers. */
export function setNewWordsLimit(next: number): void {
    store = next;
    setLocalStorageItem(NEW_WORDS_LIMIT_STORAGE_KEY, JSON.stringify(next));
    emitPreferenceChange({ newWordsLimit: next });
    for (const listener of listeners) listener();
}

export function useNewWordsLimit(): {
    newWordsLimit: number;
    setNewWordsLimit: (next: number) => void;
} {
    const newWordsLimit = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    return { newWordsLimit, setNewWordsLimit };
}
