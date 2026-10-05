"use client";

import { SavingOverlay } from "@/components/common/saving-overlay";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface PracticeSessionLayoutProps {
    title?: string;
    subtitle?: string;
    onBack: () => void;
    backDisabled?: boolean;
    isPersisting?: boolean;
    children: ReactNode;
}

/**
 * The full-screen frame before a session starts (the session plan): the same
 * exit control and column as the session itself, so starting feels like one
 * continuous screen.
 */
export function PracticeSessionLayout({
    title,
    subtitle,
    onBack,
    backDisabled = false,
    isPersisting = false,
    children,
}: Readonly<PracticeSessionLayoutProps>) {
    return (
        <main className="flex min-h-dvh flex-col">
            <SavingOverlay open={isPersisting} />
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 sm:px-6">
                <div className="flex h-16 shrink-0 items-center pt-safe">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={backDisabled}
                        className="-ml-1.5 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        aria-label="Back to course"
                    >
                        <X className="h-6 w-6" strokeWidth={2.5} />
                    </button>
                </div>
                {(title || subtitle) && (
                    <header className="mb-6 text-center">
                        {title && <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>}
                        {subtitle && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
                    </header>
                )}
                <div className="flex flex-1 flex-col pb-6">{children}</div>
            </div>
        </main>
    );
}
