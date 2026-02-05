'use client';

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setMounted(true);
            // Check initial theme from localStorage or system preference
            const storedTheme = localStorage.getItem('theme') as Theme | null;
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
        
        localStorage.setItem('theme', newTheme);
    };

    const setThemeMode = (newTheme: Theme) => {
        setTheme(newTheme);
        
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        localStorage.setItem('theme', newTheme);
    };

    return {
        theme,
        toggleTheme,
        setTheme: setThemeMode,
        mounted,
        isDark: theme === 'dark',
    };
}
