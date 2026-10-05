"use client";

import { StreakFlame } from "@/components/common/motion";
import { NothingDueState } from "@/components/features/learn/nothing-due-state";
import { Button } from "@/components/ui/button";
import { useNextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import { useUser } from "@/hooks/useUser.hook";
import { getLocalDailyHabit } from "@/lib/daily-habit";
import { estimateSessionMinutes } from "@/lib/practice-session-estimate";
import { cn } from "@/lib/utils";
import { useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { useDailyHabitDisplay } from "@/queries/daily-habit.query";
import { Brain, Clock, Play, Settings2, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

/**
 * The "Today" hero on /learn: one dominant next action, what this session
 * holds, and the way into the session settings. The goal ring and streak live
 * in `DailyGoalCard` beside it.
 */
export function DailyHero({ onOpenSettings }: Readonly<{ onOpenSettings?: () => void }>) {
    const { profile } = useUser();
    const { habit: serverHabit } = useDailyHabitDisplay();
    const habit = serverHabit ?? getLocalDailyHabit();
    const next = useNextPracticeAction();
    const { data: totalStats } = useGetMyCoursesTotalStatsQuery();
    const firstName = profile?.displayName?.split(" ")[0] ?? "there";
    const { goal } = next;
    const atRisk = habit.streakAtRisk && !goal.met;
    // Caught up only makes sense once the learner actually has words; a brand-new
    // account with no words should be nudged to pick a course instead.
    const hasWords = (totalStats?.totalWords ?? 0) > 0;
    const allCaughtUp = next.allCaughtUp && hasWords;

    // One obvious next action: due review first, then new words, else browse.
    const ctaLabel = next.wordsLoading ? "Loading…" : (next.primary?.label ?? "Browse courses");
    const ctaHref = next.primary?.href ?? "/learn/courses";
    const CtaIcon = next.primary?.kind === "new" ? Sparkles : Play;

    let headline = "Pick a course to get started";
    if (goal.met) headline = "Goal done — keep the momentum!";
    else if (atRisk) headline = `Keep your ${habit.streak}-day streak alive!`;
    else if (next.primary) headline = "Ready for today's practice?";

    // Quote the uncapped totals, the same numbers the progress card shows. The
    // CTA says how many this session takes, and `capNotice` says why.
    let status = "Nothing waiting — explore something new.";
    if (next.wordsLoading) status = "Checking what's due…";
    else if (next.dueTotal > 0 || next.newTotal > 0) {
        status = [
            next.dueTotal > 0 && `${next.dueTotal} due for review`,
            next.newTotal > 0 && `${next.newTotal} new to learn`,
        ]
            .filter(Boolean)
            .join(" · ");
    }

    const sessionWords = next.dueCount + next.newCount;
    const minutes =
        sessionWords > 0
            ? estimateSessionMinutes(sessionWords, next.newCount > 0, {
                  new: next.newCount,
                  learning: 0,
                  review: 0,
                  due: next.dueCount,
              })
            : 0;

    const settingsButton = onOpenSettings && (
        <button
            type="button"
            onClick={onOpenSettings}
            className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-[3px]",
                allCaughtUp
                    ? "border border-border/70 bg-card text-muted-foreground hover:text-foreground focus-visible:ring-ring/50"
                    : "border border-white/25 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/60",
            )}
        >
            <Settings2 className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Session settings</span>
            <span className="sr-only sm:hidden">Session settings</span>
        </button>
    );

    if (allCaughtUp) {
        return (
            <section aria-label="Today's practice" className="relative rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
                {settingsButton && <div className="absolute right-4 top-4">{settingsButton}</div>}
                <NothingDueState next={next} />
            </section>
        );
    }

    return (
        <section aria-label="Today's practice" className="gradient-hero relative overflow-hidden rounded-3xl p-5 text-white shadow-chunky sm:p-7">
            {/* Soft light blobs for depth; decorative only. */}
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-white/85">
                    {greeting()}, {firstName} 👋
                </p>
                {settingsButton}
            </div>

            <div className="relative mt-2 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[2rem] sm:leading-tight">
                        {headline}
                    </h1>
                    <p className="mt-1.5 text-sm font-medium tabular-nums text-white/80">{status}</p>
                    {next.capNotice && <p className="mt-1 text-xs font-medium text-white/70">{next.capNotice}</p>}

                    {atRisk && (
                        <p
                            role="alert"
                            className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white"
                        >
                            <StreakFlame className="h-3.5 w-3.5" lit />
                            Streak ends tonight — practice now to save it
                        </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="play"
                            size="xl"
                            asChild
                            disabled={next.wordsLoading}
                            className="border-black/10 bg-white text-primary hover:bg-white hover:brightness-[1.02] focus-visible:border-white focus-visible:ring-white/60 dark:bg-white/90 dark:text-[oklch(from_var(--brand-primary)_0.42_0.16_h)] dark:hover:bg-white/90"
                        >
                            <Link
                                href={ctaHref}
                                aria-label={next.primary ? next.primary.label : "Browse courses to get started"}
                                className="gap-2"
                            >
                                <CtaIcon className={cn("h-5 w-5", next.primary?.kind !== "new" && "fill-current")} aria-hidden />
                                {ctaLabel}
                            </Link>
                        </Button>

                        {next.reviewDueHref && next.primary?.kind !== "review" && (
                            <HeroGhostLink href={next.reviewDueHref}>
                                <Brain className="h-4 w-4" aria-hidden />
                                Review {next.dueCount}
                            </HeroGhostLink>
                        )}
                        {next.learnNewHref && next.primary?.kind !== "new" && (
                            <HeroGhostLink href={next.learnNewHref}>
                                <Sparkles className="h-4 w-4" aria-hidden />
                                Learn {next.newCount} new
                            </HeroGhostLink>
                        )}
                    </div>
                </div>

                {sessionWords > 0 && (
                    <dl aria-label="This session" className="grid shrink-0 grid-cols-3 gap-2 sm:max-w-sm xl:w-72">
                        <SessionFact icon={<Brain className="h-4 w-4" aria-hidden />} label="Review" value={next.dueCount} />
                        <SessionFact icon={<Sparkles className="h-4 w-4" aria-hidden />} label="New" value={next.newCount} />
                        <SessionFact icon={<Clock className="h-4 w-4" aria-hidden />} label="Minutes" value={`~${minutes}`} />
                    </dl>
                )}
            </div>
        </section>
    );
}

function SessionFact({ icon, label, value }: Readonly<{ icon: ReactNode; label: string; value: ReactNode }>) {
    return (
        <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
            <dt className="flex items-center gap-1 text-[11px] font-semibold text-white/80">
                {icon}
                {label}
            </dt>
            <dd className="mt-0.5 font-display text-2xl font-bold leading-none tabular-nums">{value}</dd>
        </div>
    );
}

/** Subtle secondary action pill for the gradient hero. */
function HeroGhostLink({ href, children }: Readonly<{ href: string; children: ReactNode }>) {
    return (
        <Link
            href={href}
            className="inline-flex h-11 items-center gap-1.5 rounded-2xl border border-white/25 bg-white/10 px-4 text-sm font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/60"
        >
            {children}
        </Link>
    );
}
