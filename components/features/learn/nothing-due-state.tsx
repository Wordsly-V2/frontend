"use client";

import { Mascot } from "@/components/common/motion";
import { Button } from "@/components/ui/button";
import type { NextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import { Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * The hero's "nothing to start" state.
 *
 * It has two meanings and they are not the same news. Either there genuinely is
 * nothing waiting, which is worth celebrating, or there is plenty waiting and
 * today's pacing limit is holding it back — which is also fine, but telling
 * someone with 15 due words that "nothing is due" is simply wrong, and it is how
 * a working daily limit gets reported as a bug.
 */
export function NothingDueState({ next }: { next: NextPracticeAction }) {
    const practiceLabel = next.goal.met
        ? "Goal done — practice anyway"
        : "Practice ahead";
    const heldBack = next.dueTotal + next.newTotal > 0;
    return (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
            <Mascot mood="happy" size="lg" className="animate-pop" />
            <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-gradient-brand sm:text-3xl">
                    {heldBack
                        ? "That's today's practice done! 🎉"
                        : "You're all caught up! 🎉"}
                </h2>
                <p className="mx-auto max-w-md text-sm text-muted-foreground text-balance">
                    {heldBack
                        ? (next.capNotice ??
                          "You've reached today's limit. The rest is waiting for tomorrow.")
                        : "Nothing is due right now. Come back tomorrow to keep your streak alive — or get ahead with a free review."}
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
