"use client";

import { cn } from "@/lib/utils";
import { ONBOARDING_LEVELS, type OnboardingLevel } from "@/lib/onboarding";

const LEVEL_BLURB: Record<OnboardingLevel, string> = {
    A2: "Elementary — everyday basics",
    B1: "Intermediate — comfortable conversation",
    B2: "Upper-intermediate — fluent on most topics",
    C1: "Advanced — near-native range",
};

export function OnboardingLevelStep({
    value,
    onChange,
}: {
    value: OnboardingLevel | undefined;
    onChange: (level: OnboardingLevel) => void;
}) {
    return (
        <div className="space-y-5">
            <div className="space-y-1 text-center">
                <h1 className="font-display text-2xl font-bold sm:text-3xl">
                    What&apos;s your level?
                </h1>
                <p className="text-sm text-muted-foreground">
                    We&apos;ll tune suggestions to match. Not sure? Pick the
                    closest.
                </p>
            </div>
            <div className="space-y-3">
                {ONBOARDING_LEVELS.map((level) => {
                    const active = value === level;
                    return (
                        <button
                            key={level}
                            type="button"
                            onClick={() => onChange(level)}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98]",
                                active
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-card hover:border-primary/40",
                            )}
                        >
                            <span
                                className={cn(
                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold",
                                    active
                                        ? "gradient-brand text-primary-foreground"
                                        : "bg-muted text-muted-foreground",
                                )}
                            >
                                {level}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {LEVEL_BLURB[level]}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
