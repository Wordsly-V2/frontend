"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "wordsly:sidebar-collapsed";
const listeners = new Set<() => void>();
/** Fallback for when storage throws (private mode): the toggle still works. */
let memory: boolean | null = null;

function read(): boolean {
    if (memory != null) return memory;
    try {
        return globalThis.localStorage?.getItem(STORAGE_KEY) === "1";
    } catch {
        return false;
    }
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) listener();
    };
    globalThis.addEventListener("storage", onStorage);
    return () => {
        listeners.delete(listener);
        globalThis.removeEventListener("storage", onStorage);
    };
}

/**
 * Whether the learner folded the desktop sidebar down to icons. A per-device
 * preference (localStorage), shared live between every component that reads it
 * and across tabs. Renders expanded on the server.
 */
export function useSidebarCollapsed() {
    const collapsed = useSyncExternalStore(subscribe, read, () => false);

    const setCollapsed = useCallback((next: boolean) => {
        try {
            globalThis.localStorage?.setItem(STORAGE_KEY, next ? "1" : "0");
            memory = null;
        } catch {
            memory = next;
        }
        listeners.forEach((listener) => listener());
    }, []);

    return { collapsed, setCollapsed };
}
