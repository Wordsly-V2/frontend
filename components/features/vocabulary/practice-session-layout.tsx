"use client";

import { SavingOverlay } from "@/components/common/saving-overlay";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface PracticeSessionLayoutProps {
    variant?: "overview" | "practice";
    title?: string;
    subtitle?: string;
    courseName?: string;
    onBack: () => void;
    backDisabled?: boolean;
    isPersisting?: boolean;
    /** Sticky slot below the top bar — e.g. progress during practice */
    topSlot?: ReactNode;
    children: ReactNode;
}

export function PracticeSessionLayout({
    variant = "overview",
    title,
    subtitle,
    courseName,
    onBack,
    backDisabled = false,
    isPersisting = false,
    topSlot,
    children,
}: Readonly<PracticeSessionLayoutProps>) {
    const isPractice = variant === "practice";

    return (
        <main className="bg-background flex flex-col min-h-dvh">
            <SavingOverlay open={isPersisting} />

            {isPractice ? (
                <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-md">
                    <div className="container mx-auto max-w-3xl px-3 sm:px-4 py-2.5 flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBack}
                            disabled={backDisabled}
                            className="shrink-0 h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
                            aria-label="Back to course"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{courseName ?? "Practice"}</p>
                            {subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                            )}
                        </div>
                    </div>
                    {topSlot && (
                        <div className="container mx-auto max-w-3xl px-3 sm:px-4 pb-3">
                            {topSlot}
                        </div>
                    )}
                </div>
            ) : (
                <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl flex flex-col flex-1">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="mb-4 self-start flex-shrink-0 text-muted-foreground hover:text-foreground"
                        size="sm"
                        disabled={backDisabled}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Course
                    </Button>
                    {(title || subtitle) && (
                        <header className="text-center mb-6 sm:mb-8 flex-shrink-0">
                            {title && (
                                <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="text-sm sm:text-base text-muted-foreground">{subtitle}</p>
                            )}
                        </header>
                    )}
                </div>
            )}

            <div
                className={cn(
                    "flex-1 flex flex-col min-h-0",
                    isPractice
                        ? "container mx-auto max-w-3xl px-3 sm:px-4 py-4 pb-safe w-full"
                        : "container mx-auto max-w-3xl px-3 sm:px-4 pb-6 -mt-2",
                )}
            >
                {children}
            </div>
        </main>
    );
}
