"use client";

import { setDueWordsLimit } from "@/hooks/useDueWordsLimit.hook";
import { setPracticeSettings } from "@/hooks/usePracticeSettings.hook";
import { useUser } from "@/hooks/useUser.hook";
import { setWordDetailsAutoNext } from "@/hooks/useWordDetailsAutoNext.hook";
import { readDueWordsLimitFromStorage } from "@/lib/due-words-limit";
import { readPracticeSettingsFromStorage } from "@/lib/practice-settings";
import {
    hasPendingPreferenceWrites,
    registerRemotePush,
    withHydration,
} from "@/lib/preferences-sync";
import { readWordDetailsAutoNextFromStorage } from "@/lib/word-details-auto-next";
import {
    useGetPreferencesQuery,
    useUpdatePreferencesMutation,
} from "@/queries/preferences.query";
import type { IAppPreferences } from "@/types/preferences/preferences.type";
import { useTheme as useNextThemes } from "next-themes";
import { useEffect, useRef } from "react";

/**
 * Bridges the local preference stores with the synced server blob. Mount once
 * (in Providers). While signed in it:
 *  - registers the debounced local edits to PATCH the server,
 *  - hydrates the local stores from the server blob on load (server wins, but
 *    never clobbers an edit that hasn't synced yet), and
 *  - on first load, seeds the server from this device's existing local settings
 *    for any slice the server has never stored (migration for existing users).
 */
export function usePreferencesSync(): void {
    const { profile } = useUser();
    const enabled = Boolean(profile);
    const { data } = useGetPreferencesQuery(enabled);
    const { mutate } = useUpdatePreferencesMutation();
    const { setTheme } = useNextThemes();
    const migratedRef = useRef(false);

    // Route debounced local edits to the server only while signed in.
    useEffect(() => {
        if (!enabled) {
            registerRemotePush(null);
            migratedRef.current = false;
            return;
        }
        registerRemotePush((patch: IAppPreferences) => mutate(patch));
        return () => registerRemotePush(null);
    }, [enabled, mutate]);

    useEffect(() => {
        if (!enabled || !data) return;
        const prefs = data.preferences ?? {};

        // Server is the source of truth on load — but don't overwrite an edit the
        // user just made that is still waiting to sync.
        if (!hasPendingPreferenceWrites()) {
            withHydration(() => {
                if (prefs.practice) setPracticeSettings(prefs.practice);
                if (typeof prefs.dueWordsLimit === "number") {
                    setDueWordsLimit(prefs.dueWordsLimit);
                }
                if (prefs.wordDetailsAutoNext) {
                    setWordDetailsAutoNext(prefs.wordDetailsAutoNext);
                }
                if (prefs.theme) setTheme(prefs.theme);
            });
        }

        if (migratedRef.current) return;
        migratedRef.current = true;

        // Seed slices the server has never stored from this device's local values
        // so existing users don't lose their settings on first sync.
        const seed: IAppPreferences = {};
        if (prefs.practice === undefined) {
            seed.practice = readPracticeSettingsFromStorage();
        }
        if (prefs.dueWordsLimit === undefined) {
            seed.dueWordsLimit = readDueWordsLimitFromStorage();
        }
        if (prefs.wordDetailsAutoNext === undefined) {
            seed.wordDetailsAutoNext = readWordDetailsAutoNextFromStorage();
        }
        if (Object.keys(seed).length > 0) mutate(seed);
    }, [enabled, data, mutate, setTheme]);
}
