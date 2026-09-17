"use client";

import { useDifficultWords } from "@/hooks/useDifficultWords.hook";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * The way in to the difficult-words page from the learn hub.
 *
 * Renders nothing when there is nothing tricky — an empty prompt on the home
 * screen every day is noise, and the page's own empty state covers the learner
 * who goes looking.
 */
export function DifficultWordsEntry({ className }: Readonly<{ className?: string }>) {
    const { allRows, isLoading } = useDifficultWords(undefined);

    if (isLoading || allRows.length === 0) return null;

    const savedCount = allRows.filter((row) => row.isSaved).length;

    return (
        <Link
            href="/learn/difficult"
            className={cn(
                "mb-8 flex items-center gap-3 rounded-3xl border border-amber-200/80 bg-amber-50/90 px-5 py-4 transition-colors hover:bg-amber-100/80 dark:border-amber-800/50 dark:bg-amber-950/30 dark:hover:bg-amber-950/50",
                className,
            )}
        >
            <AlertTriangle
                className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
            />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {allRows.length} difficult word{allRows.length === 1 ? "" : "s"}
                </p>
                <p className="mt-0.5 text-xs text-amber-700/90 dark:text-amber-300/90">
                    {savedCount > 0
                        ? `${savedCount} you saved · practise them any time`
                        : "Words you keep slipping on — practise them any time"}
                </p>
            </div>
            <ArrowRight
                className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300"
                aria-hidden
            />
        </Link>
    );
}
