"use client";

import { CountUp, Mascot } from "@/components/common/motion";
import { Button } from "@/components/ui/button";
import { dailyGoalProgress } from "@/lib/daily-habit";
import { fireCelebrationConfetti } from "@/lib/confetti";
import { playLevelUpSound } from "@/lib/practice-sounds";
import { useEnterKeyAction } from "@/lib/keyboard-utils";
import { pickSessionCompleteMessage } from "@/lib/practice-feedback";
import type { IDailyHabit } from "@/types/daily-habit/daily-habit.type";
import { AnswerQuality } from "@/types/word-progress/word-progress.type";
import type { ILevelEvent } from "@/types/word-progress/word-progress.type";
import type { WordResult } from "@/types/practice/practice.type";
import { motion } from "motion/react";
import {
    ArrowRight,
    Award,
    Flame,
    Home,
    Sparkles,
    Target,
    TrendingUp,
    Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export type SessionWordResult = WordResult;

export interface PracticeSessionSummaryProps {
    wordResults: SessionWordResult[];
    score: number;
    habitState: IDailyHabit;
    /** Server level snapshot + XP delta from a live sync (undefined when queued). */
    levelEvent?: ILevelEvent;
    /** Streak-bonus XP multiplier from a live sync (1 = no bonus). */
    xpMultiplier?: number;
    onKeepGoing: () => void;
    onBackToDashboard: () => void;
}

export function PracticeSessionSummary({
    wordResults,
    score,
    habitState,
    levelEvent,
    xpMultiplier,
    onKeepGoing,
    onBackToDashboard,
}: Readonly<PracticeSessionSummaryProps>) {
    const strongCount = wordResults.filter(
        (r) => r.quality >= AnswerQuality.CORRECT_WITH_HESITATION,
    ).length;
    // Prefer the server-authoritative XP for this session; fall back to a local
    // estimate only while the live sync is still in flight (or offline).
    const xp = levelEvent?.xpEarned ?? strongCount * 10;
    const leveledUp = levelEvent?.leveledUp ?? false;
    const hasStreakBonus = (xpMultiplier ?? 1) > 1;
    const goal = dailyGoalProgress(habitState.wordsToday, habitState.goal);
    const headline = pickSessionCompleteMessage(score, wordResults.length);

    // Extra celebration the moment a goal is hit (persistence hook already fires
    // a confetti burst on continue; this one is gated to the goal-met payoff).
    useEffect(() => {
        if (habitState.goalMetToday) fireCelebrationConfetti();
    }, [habitState.goalMetToday]);

    // Level-up payoff: fire once when the server confirms a boundary crossing.
    const leveledUpCelebrated = useRef(false);
    useEffect(() => {
        if (leveledUp && !leveledUpCelebrated.current) {
            leveledUpCelebrated.current = true;
            fireCelebrationConfetti();
            playLevelUpSound();
        }
    }, [leveledUp]);

    // Achievement unlocks: one celebratory toast per newly-earned badge, fired
    // once (keyed) so a re-render can't double-toast.
    const toastedAchievementsRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        const unlocked = habitState.unlockedAchievements ?? [];
        for (const achievement of unlocked) {
            if (toastedAchievementsRef.current.has(achievement.key)) continue;
            toastedAchievementsRef.current.add(achievement.key);
            toast.success(`Achievement unlocked! ${achievement.label}`, {
                icon: "🏆",
                duration: 5000,
                id: `achievement-${achievement.key}`,
                description:
                    achievement.xpAwarded > 0
                        ? `+${achievement.xpAwarded} XP`
                        : undefined,
            });
        }
    }, [habitState.unlockedAchievements]);

    // Let players keep their flow going with the keyboard.
    useEnterKeyAction(onKeepGoing);

    const reveal = (delay: number) => ({
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, duration: 0.4 },
    });

    return (
        <div className="text-center py-4 sm:py-8 max-w-lg mx-auto w-full">
            <motion.div {...reveal(0)} className="flex justify-center">
                <Mascot mood="celebrate" size="lg" />
            </motion.div>

            <motion.h2
                {...reveal(0.1)}
                className="mt-3 font-display text-2xl sm:text-3xl font-bold text-primary"
            >
                {headline}
            </motion.h2>
            <motion.p
                {...reveal(0.15)}
                className="text-muted-foreground mb-2 text-sm sm:text-base"
            >
                {wordResults.length} word{wordResults.length === 1 ? "" : "s"} practiced
            </motion.p>

            {hasStreakBonus && (
                <motion.p
                    {...reveal(0.18)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-accent)]/10 px-3 py-1 text-sm font-bold text-[var(--brand-accent)] mb-4"
                >
                    <Zap className="h-4 w-4" aria-hidden />
                    ×{xpMultiplier} streak bonus
                </motion.p>
            )}

            {leveledUp && levelEvent && (
                <motion.div
                    {...reveal(0.2)}
                    className="mx-auto mb-4 flex max-w-sm items-center gap-3 rounded-2xl border-2 border-primary/40 bg-primary/10 px-4 py-3 text-left"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                        <TrendingUp className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0">
                        <p className="font-display text-base font-bold text-primary">
                            Level up! You reached level {levelEvent.level}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {levelEvent.rank} · keep it going!
                        </p>
                    </div>
                    <Award className="ml-auto h-5 w-5 shrink-0 text-primary" aria-hidden />
                </motion.div>
            )}

            {habitState.goalMetToday && (
                <motion.p
                    {...reveal(0.2)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary mb-4"
                >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Daily goal complete
                    {habitState.goalStreak > 1 &&
                        ` · ${habitState.goalStreak}-day goal streak`}
                </motion.p>
            )}

            <motion.div
                {...reveal(0.25)}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto mb-6 sm:mb-8"
            >
                <StatTile label="XP earned" accent>
                    <CountUp value={xp} prefix="+" />
                </StatTile>
                <StatTile label="Score">{score}%</StatTile>
                <StatTile label="Strong" icon={<Sparkles className="h-3 w-3" />}>
                    {strongCount}
                </StatTile>
                <StatTile label="Streak" icon={<Flame className="h-3 w-3" />}>
                    {habitState.streak}
                </StatTile>
            </motion.div>

            <motion.div
                {...reveal(0.3)}
                className="max-w-md mx-auto mb-6 sm:mb-8 text-left"
            >
                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2">
                    <span className="inline-flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" aria-hidden />
                        Daily goal
                    </span>
                    <span>
                        {goal.met
                            ? "Done for today!"
                            : `${goal.remaining} more to go`}
                    </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--brand-accent)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.percent}%` }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    />
                </div>
            </motion.div>

            <motion.div
                {...reveal(0.4)}
                className="flex flex-col sm:flex-row gap-3 justify-center"
            >
                <Button
                    variant="play"
                    size="lg"
                    onClick={onKeepGoing}
                    className="gap-2"
                >
                    Keep going
                    <ArrowRight className="h-4 w-4" aria-hidden />
                    <span className="ml-0.5 text-xs opacity-70 font-normal">
                        Enter
                    </span>
                </Button>
                <Button
                    variant="playOutline"
                    size="lg"
                    onClick={onBackToDashboard}
                    className="gap-2"
                >
                    <Home className="h-4 w-4" aria-hidden />
                    Back to home
                </Button>
            </motion.div>
        </div>
    );
}

function StatTile({
    label,
    icon,
    accent,
    children,
}: {
    label: string;
    icon?: React.ReactNode;
    accent?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            className={
                accent
                    ? "rounded-2xl border-2 border-primary/30 bg-primary/5 p-3"
                    : "rounded-2xl border-2 border-border bg-card p-3"
            }
        >
            <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                {icon}
                {label}
            </p>
            <p
                className={
                    accent
                        ? "font-display text-2xl font-bold text-primary tabular-nums"
                        : "font-display text-2xl font-bold text-foreground tabular-nums"
                }
            >
                {children}
            </p>
        </div>
    );
}
