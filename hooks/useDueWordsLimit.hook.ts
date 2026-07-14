"use client";

import {
    DEFAULT_DUE_WORDS_LIMIT,
    DUE_WORDS_LIMIT_STORAGE_KEY,
    readDueWordsLimitFromStorage,
} from "@/lib/due-words-limit";
import { setLocalStorageItem } from "@/lib/local-storage";
import { useSyncExternalStore } from "react";

/**
 * Single source of truth for the "words per session" batch size.
 *
 * A module-level store keeps every consumer (the course page, the learn quick
 * actions, and the practice settings dialog that writes) in sync without
 * prop-drilling, and persists to localStorage. Mirrors usePracticeSettings.
 */
let store: number | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): number {
    if (store === null) store = readDueWordsLimitFromStorage();
    return store;
}

function getServerSnapshot(): number {
    return DEFAULT_DUE_WORDS_LIMIT;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Update the limit, persist, and notify all consumers. */
export function setDueWordsLimit(next: number): void {
    store = next;
    setLocalStorageItem(DUE_WORDS_LIMIT_STORAGE_KEY, JSON.stringify(next));
    for (const listener of listeners) listener();
}

export function useDueWordsLimit(): {
    dueWordsLimit: number;
    setDueWordsLimit: (next: number) => void;
} {
    const dueWordsLimit = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    return { dueWordsLimit, setDueWordsLimit };
}
