"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import { type ReactNode, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export type PracticeFooterTone = "neutral" | "correct" | "near" | "incorrect";

const TONE_SURFACE: Record<PracticeFooterTone, string> = {
    neutral: "border-border/70 bg-background/95",
    correct:
        "border-[var(--brand-success)]/40 bg-[color-mix(in_oklch,var(--brand-success)_16%,var(--background))]",
    near: "border-[var(--brand-warning)]/50 bg-[color-mix(in_oklch,var(--brand-warning)_20%,var(--background))]",
    incorrect:
        "border-destructive/35 bg-[color-mix(in_oklch,var(--destructive)_12%,var(--background))]",
};

const TONE_TEXT: Record<PracticeFooterTone, string> = {
    neutral: "text-foreground",
    correct: "text-green-800 dark:text-green-200",
    near: "text-amber-800 dark:text-amber-200",
    incorrect: "text-red-800 dark:text-red-200",
};

const TONE_BADGE: Record<Exclude<PracticeFooterTone, "neutral">, string> = {
    correct: "bg-[var(--brand-success)] text-white",
    near: "bg-[var(--brand-warning)] text-amber-950",
    incorrect: "bg-destructive text-white",
};

interface PracticeFooterBarProps {
    tone?: PracticeFooterTone;
    /** Headline next to the badge ("Great job!", "Not quite"). Omit for a bare action bar. */
    title?: ReactNode;
    /** One quieter line under the title. */
    detail?: ReactNode;
    /** The main button (Continue, Start practicing…). */
    action: ReactNode;
}

const subscribeToNothing = () => () => {};

/**
 * The session's action bar, pinned to the bottom of the screen: the answer's
 * verdict and the one button that moves on. Always in the same place, so the
 * learner's thumb (or Enter) never has to look for it.
 *
 * Portalled to <body>: the exercise card animates with transforms and uses a
 * backdrop filter, and either would make it, not the viewport, the containing
 * block of a `position: fixed` child. Pages render `PracticeFooterSpacer` at
 * the end of their content so nothing hides under the bar.
 */
export function PracticeFooterBar({ tone = "neutral", title, detail, action }: Readonly<PracticeFooterBarProps>) {
    // Portals need a document; the server snapshot renders nothing.
    const mounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);
    if (!mounted) return null;

    const Icon = tone === "incorrect" ? XCircle : CheckCircle2;

    return createPortal(
        <div
            role="region"
            aria-label="Answer"
            className={cn(
                "fixed inset-x-0 bottom-0 z-40 border-t-2 pb-safe backdrop-blur-xl",
                "animate-in slide-in-from-bottom-4 fade-in duration-200 motion-reduce:animate-none",
                TONE_SURFACE[tone],
            )}
        >
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-5">
                {title && (
                    <div aria-live="polite" className={cn("flex min-w-0 flex-1 items-center gap-3", TONE_TEXT[tone])}>
                        {tone !== "neutral" && (
                            <span
                                className={cn(
                                    "animate-pop flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                                    TONE_BADGE[tone],
                                )}
                            >
                                <Icon className="h-6 w-6" strokeWidth={2.5} aria-hidden />
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="font-display text-xl font-extrabold leading-tight">{title}</p>
                            {detail && <div className="mt-0.5 text-sm font-medium opacity-90">{detail}</div>}
                        </div>
                    </div>
                )}
                <div className={cn("flex shrink-0 flex-col", title ? "sm:w-56" : "w-full")}>{action}</div>
            </div>
        </div>,
        document.body,
    );
}

/** Space at the end of a page so its last lines clear the footer bar. */
export function PracticeFooterSpacer({ withVerdict = false }: Readonly<{ withVerdict?: boolean }>) {
    return <div aria-hidden className={withVerdict ? "h-40 shrink-0 sm:h-28" : "h-24 shrink-0 sm:h-28"} />;
}
