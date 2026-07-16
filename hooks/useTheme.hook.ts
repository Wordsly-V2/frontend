"use client";

import { emitPreferenceChange } from "@/lib/preferences-sync";
import { useTheme as useNextThemes } from "next-themes";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

/**
 * Wraps next-themes for compatibility with existing components (mounted, isDark, toggle).
 */
export function useTheme() {
    const { theme, setTheme, resolvedTheme } = useNextThemes();
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    const isDark = resolvedTheme === "dark";

    const toggleTheme = () => {
        const next = isDark ? "light" : "dark";
        setTheme(next);
        emitPreferenceChange({ theme: next });
    };

    const setThemeMode = (newTheme: Theme) => {
        setTheme(newTheme);
        emitPreferenceChange({ theme: newTheme });
    };

    return {
        theme: (resolvedTheme === "dark" || resolvedTheme === "light" ? resolvedTheme : theme) as Theme | undefined,
        toggleTheme,
        setTheme: setThemeMode,
        mounted,
        isDark,
    };
}
