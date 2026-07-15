"use client";

import type { ActivePracticeMode } from "@/lib/practice-settings";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

interface ShortcutItem {
    keys: string[];
    label: string;
}

const SHORTCUTS_BY_MODE: Record<ActivePracticeMode, ShortcutItem[]> = {
    flashcard: [
        { keys: ["1"], label: "Easy" },
        { keys: ["2"], label: "Got it" },
        { keys: ["3"], label: "Hard" },
        { keys: ["4"], label: "Forgot" },
    ],
    "word-bank": [
        { keys: ["A", "B", "C", "D"], label: "Pick answer" },
    ],
    cloze: [
        { keys: ["A", "B", "C", "D"], label: "Pick answer" },
    ],
    listening: [{ keys: ["Enter"], label: "Submit" }],
    context: [{ keys: ["Enter"], label: "Submit" }],
    speaking: [],
};

function KeyChip({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <kbd className="pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center rounded-md border border-border/80 bg-muted/80 px-1 font-mono text-[10px] font-medium text-muted-foreground">
            {children}
        </kbd>
    );
}

/**
 * Compact, desktop-only legend for the practice keyboard shortcuts.
 * Hidden on touch/small screens; shows only shortcuts for the active mode.
 */
export function PracticeShortcutsHint({
    mode,
    className,
}: Readonly<{ mode: ActivePracticeMode; className?: string }>) {
    const shortcuts = SHORTCUTS_BY_MODE[mode];
    if (!shortcuts || shortcuts.length === 0) return null;

    return (
        <div
            aria-hidden="true"
            className={cn(
                "glass-surface hidden md:flex w-fit mx-auto items-center justify-center gap-4 rounded-full px-4 py-1.5 text-[11px] text-muted-foreground/90",
                className,
            )}
        >
            <Keyboard className="h-3.5 w-3.5 shrink-0" />
            {shortcuts.map((shortcut) => (
                <span
                    key={shortcut.label}
                    className="inline-flex items-center gap-1.5"
                >
                    <span className="inline-flex items-center gap-0.5">
                        {shortcut.keys.map((key) => (
                            <KeyChip key={key}>{key}</KeyChip>
                        ))}
                    </span>
                    {shortcut.label}
                </span>
            ))}
        </div>
    );
}
