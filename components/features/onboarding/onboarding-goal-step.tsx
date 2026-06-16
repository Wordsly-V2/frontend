"use client";

import { cn } from "@/lib/utils";
import { DAILY_GOAL_OPTIONS } from "@/types/daily-habit/daily-habit.type";
import { Coffee, Flame, Rocket, Zap } from "lucide-react";

const GOAL_META: Record<
    number,
    { label: string; blurb: string; icon: typeof Coffee }
> = {
    5: { label: "Casual", blurb: "~2 min/day", icon: Coffee },
    10: { label: "Regular", blurb: "~5 min/day", icon: Zap },
    15: { label: "Serious", blurb: "~8 min/day", icon: Flame },
    20: { label: "Intense", blurb: "~10 min/day", icon: Rocket },
    30: { label: "Beast", blurb: "~15 min/day", icon: Rocket },
};

export function OnboardingGoalStep({
    value,
    onChange,
}: {
    value: number | undefined;
    onChange: (goal: number) => void;
}) {
    return (
        <div className="space-y-5">
            <div className="space-y-1 text-center">
                <h1 className="font-display text-2xl font-bold sm:text-3xl">
                    Pick your daily goal
                </h1>
                <p className="text-sm text-muted-foreground">
                    How many new words a day? You can change this anytime.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DAILY_GOAL_OPTIONS.map((goal) => {
                    const meta = GOAL_META[goal];
                    const Icon = meta.icon;
                    const active = value === goal;
                    return (
                        <button
                            key={goal}
                            type="button"
                            onClick={() => onChange(goal)}
                            className={cn(
                                "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98]",
                                active
                                    ? "border-primary bg-primary/10 shadow-pressable-sm [--btn-shadow:var(--primary-shadow)]"
                                    : "border-border bg-card hover:border-primary/40",
                            )}
                        >
                            <div
                                className={cn(
                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                                    active
                                        ? "gradient-brand text-primary-foreground"
                                        : "bg-muted text-muted-foreground",
                                )}
                            >
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-display text-base font-bold">
                                    {goal} words
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {meta.label} · {meta.blurb}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
