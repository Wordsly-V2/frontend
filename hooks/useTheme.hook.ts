'use client';

import { getLocalStorageItem, setLocalStorageItem, THEME_STORAGE_KEY } from '@/lib/local-storage';
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setMounted(true);
            // Check initial theme from localStorage or system preference
            const raw = getLocalStorageItem(THEME_STORAGE_KEY);
            const storedTheme =
                raw === 'dark' || raw === 'light' ? (raw as Theme) : null;
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            const initialTheme = storedTheme || systemTheme;
            
            setTheme(initialTheme);
            
            if (initialTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }, 0);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        setLocalStorageItem(THEME_STORAGE_KEY, newTheme);
    };

    const setThemeMode = (newTheme: Theme) => {
        setTheme(newTheme);
        
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        setLocalStorageItem(THEME_STORAGE_KEY, newTheme);
    };

    return {
        theme,
        toggleTheme,
        setTheme: setThemeMode,
        mounted,
        isDark: theme === 'dark',
    };
}
