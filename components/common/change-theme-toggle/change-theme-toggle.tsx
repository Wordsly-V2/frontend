'use client';

import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/hooks/useTheme";

export function ChangeThemeToggle() {
    const { toggleTheme, mounted, isDark } = useTheme();

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-6 w-11 rounded-full bg-input" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            {/* Sun icon - Light mode indicator */}
            <svg
                className={`h-5 w-5 transition-colors ${isDark ? 'text-muted-foreground' : 'text-foreground'
                    }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>

            {/* Switch */}
            <Switch
                checked={isDark}
                onCheckedChange={toggleTheme}
                aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            />

            {/* Moon icon - Dark mode indicator */}
            <svg
                className={`h-5 w-5 transition-colors ${isDark ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
            </svg>
        </div>
    );
}
