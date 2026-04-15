"use client";

import { useTheme as useNextThemes } from "next-themes";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

/**
 * Wraps next-themes for compatibility with existing components (mounted, isDark, toggle).
 */
export function useTheme() {
    const { theme, setTheme, resolvedTheme } = useNextThemes();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = resolvedTheme === "dark";

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    const setThemeMode = (newTheme: Theme) => {
        setTheme(newTheme);
    };

    return {
        theme: (resolvedTheme === "dark" || resolvedTheme === "light" ? resolvedTheme : theme) as Theme | undefined,
        toggleTheme,
        setTheme: setThemeMode,
        mounted,
        isDark,
    };
}
