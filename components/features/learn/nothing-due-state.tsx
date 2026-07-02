"use client";

import { Mascot } from "@/components/common/motion";
import { Button } from "@/components/ui/button";
import type { NextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import { Sparkles } from "lucide-react";
import Link from "next/link";

/** Celebratory "all caught up" state shown in the hero when nothing is due/new. */
export function NothingDueState({ next }: { next: NextPracticeAction }) {
    const practiceLabel = next.goal.met
        ? "Goal done — practice anyway"
        : "Practice ahead";
    return (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
            <Mascot mood="happy" size="lg" className="animate-pop" />
            <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-gradient-brand sm:text-3xl">
                    You&apos;re all caught up! 🎉
                </h2>
                <p className="mx-auto max-w-md text-sm text-muted-foreground text-balance">
                    Nothing is due right now. Come back tomorrow to keep your
                    streak alive — or get ahead with a free review.
                </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
                {next.last && (
                    <Button
                        variant="play"
                        size="lg"
                        asChild
                        className="glow-primary"
                    >
                        <Link
                            href={`/learn/courses/${next.last.id}`}
                            aria-label={practiceLabel}
                            className="gap-2"
                        >
                            <Sparkles className="h-4 w-4" aria-hidden />
                            {practiceLabel}
                        </Link>
                    </Button>
                )}
                <Button variant="playOutline" size="lg" asChild>
                    <Link href="/learn/courses">Browse courses</Link>
                </Button>
            </div>
        </div>
    );
}
