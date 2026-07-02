"use client";

import { CountUp, StreakFlame } from "@/components/common/motion";
import { NothingDueState } from "@/components/features/learn/nothing-due-state";
import { Button } from "@/components/ui/button";
import { useNextPracticeAction } from "@/hooks/useNextPracticeAction.hook";
import { useUser } from "@/hooks/useUser.hook";
import { getLocalDailyHabit } from "@/lib/daily-habit";
import { cn } from "@/lib/utils";
import { useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { useDailyHabitDisplay } from "@/queries/daily-habit.query";
import { Brain, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

/**
 * "Today" mission-control hero — Aurora gradient banner with one dominant
 * next action, the day's status, and a motion-animated daily-goal ring.
 */
export function DailyHero() {
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
    const ctaLabel = next.wordsLoading
        ? "Loading…"
        : (next.primary?.label ?? "Browse courses");
    const ctaHref = next.primary?.href ?? "/learn/courses";
    const CtaIcon = next.primary?.kind === "new" ? Sparkles : Play;

    const headline = goal.met
        ? "Goal done — keep the momentum!"
        : atRisk
          ? `Keep your ${habit.streak}-day streak alive!`
          : next.primary
            ? "Ready for today's mission?"
            : "Pick a course to get started";

    const status = next.wordsLoading
        ? "Checking what's due…"
        : next.dueCount > 0 || next.newCount > 0
          ? [
                next.dueCount > 0 &&
                    `${next.dueCount} due for review`,
                next.newCount > 0 && `${next.newCount} new to learn`,
            ]
                .filter(Boolean)
                .join(" · ")
          : "Nothing waiting — explore something new.";

    return (
        <section
            aria-label="Today's practice"
            className={cn(
                "relative mb-6 overflow-hidden rounded-3xl",
                allCaughtUp
                    ? "glass-surface p-5 sm:p-7"
                    : "gradient-hero p-5 text-white shadow-chunky sm:p-7",
            )}
        >
            {allCaughtUp ? (
                <NothingDueState next={next} />
            ) : (
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-4">
                        <div>
                            <p className="text-sm font-semibold text-white/85">
                                {greeting()}, {firstName} 👋
                            </p>
                            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                {headline}
                            </h1>
                            <p className="mt-1.5 text-sm font-medium text-white/75 tabular-nums">
                                {status}
                            </p>
                        </div>

                        {atRisk && (
                            <p
                                role="alert"
                                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white animate-pulse"
                            >
                                <StreakFlame className="h-3.5 w-3.5" lit />
                                Streak ends tonight — practice now to save it
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button
                                variant="play"
                                size="xl"
                                asChild
                                disabled={next.wordsLoading}
                                className="glow-primary bg-white text-primary border-black/10 hover:bg-white hover:brightness-[1.02] focus-visible:ring-white/60 focus-visible:border-white"
                            >
                                <Link
                                    href={ctaHref}
                                    aria-label={
                                        next.primary
                                            ? next.primary.label
                                            : "Browse courses to get started"
                                    }
                                    className="gap-2"
                                >
                                    <CtaIcon
                                        className={cn(
                                            "h-5 w-5",
                                            next.primary?.kind !== "new" &&
                                                "fill-current",
                                        )}
                                        aria-hidden
                                    />
                                    {ctaLabel}
                                </Link>
                            </Button>

                            {next.reviewDueHref &&
                                next.primary?.kind !== "review" && (
                                    <HeroGhostLink href={next.reviewDueHref}>
                                        <Brain
                                            className="h-4 w-4"
                                            aria-hidden
                                        />
                                        Review {next.dueCount}
                                    </HeroGhostLink>
                                )}
                            {next.learnNewHref &&
                                next.primary?.kind !== "new" && (
                                    <HeroGhostLink href={next.learnNewHref}>
                                        <Sparkles
                                            className="h-4 w-4"
                                            aria-hidden
                                        />
                                        Learn {next.newCount} new
                                    </HeroGhostLink>
                                )}
                        </div>
                    </div>

                    <GoalRing
                        percent={goal.percent}
                        done={habit.wordsToday}
                        goal={goal.goal}
                        met={goal.met}
                        streak={habit.streak}
                        atRisk={atRisk}
                    />
                </div>
            )}
        </section>
    );
}

/** Subtle secondary action pill for the gradient hero. */
function HeroGhostLink({
    href,
    children,
}: Readonly<{ href: string; children: React.ReactNode }>) {
    return (
        <Link
            href={href}
            className="inline-flex h-11 items-center gap-1.5 rounded-2xl border border-white/25 bg-white/10 px-4 text-sm font-bold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/60"
        >
            {children}
        </Link>
    );
}

/** Radial daily-goal progress with a motion-animated fill and streak flame. */
function GoalRing({
    percent,
    done,
    goal,
    met,
    streak,
    atRisk,
}: Readonly<{
    percent: number;
    done: number;
    goal: number;
    met: boolean;
    streak: number;
    atRisk: boolean;
}>) {
    const reduce = useReducedMotion();
    const r = 52;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, percent) / 100) * c;

    return (
        <div className="mx-auto flex shrink-0 flex-col items-center gap-2.5 lg:mx-0">
            <div
                role="progressbar"
                aria-valuenow={Math.min(100, Math.round(percent))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Daily goal: ${done} of ${goal} words practiced today`}
                className="relative flex h-36 w-36 items-center justify-center"
            >
                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        strokeWidth="12"
                        className="stroke-white/20"
                    />
                    <motion.circle
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={c}
                        initial={
                            reduce ? false : { strokeDashoffset: c }
                        }
                        animate={{ strokeDashoffset: offset }}
                        transition={
                            reduce
                                ? { duration: 0 }
                                : {
                                      type: "spring",
                                      stiffness: 55,
                                      damping: 16,
                                  }
                        }
                        className={
                            met
                                ? "stroke-[var(--brand-warning)]"
                                : "stroke-white"
                        }
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <CountUp
                        value={done}
                        className="font-display text-3xl font-bold tabular-nums leading-none text-white"
                    />
                    <span className="text-xs font-medium text-white/80">
                        / {goal} words
                    </span>
                </div>
            </div>

            <span
                className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-extrabold tabular-nums text-white",
                    atRisk
                        ? "border-white/40 bg-white/20"
                        : "border-white/25 bg-white/10",
                )}
            >
                <StreakFlame className="h-3.5 w-3.5" lit={streak > 0} />
                {streak}-day streak
            </span>
        </div>
    );
}
