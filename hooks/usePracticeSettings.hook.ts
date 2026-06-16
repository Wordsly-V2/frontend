"use client";

import type { PracticeSettings } from "@/components/features/vocabulary/practice-settings-dialog";
import { setLocalStorageItem } from "@/lib/local-storage";
import {
    DEFAULT_PRACTICE_SETTINGS,
    readPracticeSettingsFromStorage,
    SETTINGS_STORAGE_KEY,
} from "@/lib/practice-settings";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Single source of truth for practice settings.
 *
 * A module-level store keeps every consumer (the settings dialog that writes,
 * and the practice screen that reads) in sync without prop-drilling, and
 * persists to localStorage. Settings only ever change when the user edits them.
 */
let store: PracticeSettings | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): PracticeSettings {
    if (store === null) store = readPracticeSettingsFromStorage();
    return store;
}

function getServerSnapshot(): PracticeSettings {
    return DEFAULT_PRACTICE_SETTINGS;
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** Replace the whole settings object, persist, and notify all consumers. */
export function setPracticeSettings(next: PracticeSettings): void {
    store = next;
    try {
        setLocalStorageItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
        console.error("Failed to save practice settings:", error);
    }
    for (const listener of listeners) listener();
}

export function usePracticeSettings(): {
    settings: PracticeSettings;
    setSettings: (next: PracticeSettings) => void;
    updateSettings: (patch: Partial<PracticeSettings>) => void;
} {
    const settings = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    const updateSettings = useCallback(
        (patch: Partial<PracticeSettings>) =>
            setPracticeSettings({ ...getSnapshot(), ...patch }),
        [],
    );

    return { settings, setSettings: setPracticeSettings, updateSettings };
}
