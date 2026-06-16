"use client";

import { Mascot } from "@/components/common/motion";
import { Button } from "@/components/ui/button";
import { Headphones, Keyboard, Layers, ListChecks } from "lucide-react";

const PREVIEW = [
    { icon: Keyboard, label: "Type the word" },
    { icon: Headphones, label: "Listen & spell" },
    { icon: ListChecks, label: "Multiple choice" },
    { icon: Layers, label: "Flashcards" },
];

export function OnboardingStartStep({
    hasCourses,
    goal,
    onStart,
    starting,
}: {
    hasCourses: boolean;
    goal: number | undefined;
    onStart: () => void;
    starting: boolean;
}) {
    return (
        <div className="space-y-6 text-center">
            <Mascot mood="celebrate" size="lg" className="mx-auto" />
            <div className="space-y-1">
                <h1 className="font-display text-2xl font-bold sm:text-3xl">
                    You&apos;re all set!
                </h1>
                <p className="mx-auto max-w-sm text-sm text-muted-foreground text-balance">
                    {goal
                        ? `${goal} words a day keeps the streak going. `
                        : ""}
                    Here&apos;s how practice works:
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {PREVIEW.map(({ icon: Icon, label }) => (
                    <div
                        key={label}
                        className="flex items-center gap-2.5 rounded-2xl border-2 border-border bg-card p-3 text-left"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold">{label}</span>
                    </div>
                ))}
            </div>

            <Button
                variant="play"
                size="xl"
                className="w-full"
                onClick={onStart}
                disabled={starting}
            >
                {starting
                    ? "Setting up…"
                    : hasCourses
                      ? "Start my first session"
                      : "Browse starter courses"}
            </Button>
        </div>
    );
}
