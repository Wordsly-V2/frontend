import { cn } from "@/lib/utils";
import {
    Brain,
    CloudOff,
    Flame,
    Headphones,
    Keyboard,
    Layers,
    ListChecks,
    PencilLine,
    Sparkles,
    Trophy,
} from "lucide-react";

const PRACTICE_MODES = [
    { icon: Layers, label: "Flashcard" },
    { icon: Keyboard, label: "In context" },
    { icon: Headphones, label: "Listening" },
    { icon: ListChecks, label: "Word bank" },
    { icon: PencilLine, label: "Fill-in" },
] as const;

const REVIEW_INTERVALS = ["10m", "1d", "4d", "12d", "1mo"] as const;

interface BentoCardProps {
    className?: string;
    children: React.ReactNode;
}

function BentoCard({ className, children }: Readonly<BentoCardProps>) {
    return (
        <div
            className={cn(
                "glass-surface card-hover flex flex-col rounded-3xl p-6 sm:p-7",
                className,
            )}
        >
            {children}
        </div>
    );
}

interface IconChipProps {
    gradient: string;
    children: React.ReactNode;
}

function IconChip({ gradient, children }: Readonly<IconChipProps>) {
    return (
        <div
            className={cn(
                "mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md",
                gradient,
            )}
        >
            {children}
        </div>
    );
}

export function FeatureBento() {
    return (
        <section className="py-14 sm:py-20">
            <div className="container mx-auto max-w-6xl px-4 sm:px-6">
                <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
                    Built to beat the forgetting curve
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
                    Everything in Wordsly serves one goal: words you can still recall
                    months from now.
                </p>

                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                    {/* FSRS — the headline feature */}
                    <BentoCard className="sm:col-span-2 lg:col-span-2">
                        <IconChip gradient="gradient-brand">
                            <Brain className="h-5 w-5" aria-hidden />
                        </IconChip>
                        <h3 className="text-lg font-bold">
                            FSRS spaced repetition
                        </h3>
                        <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
                            A modern memory model times every review just before you
                            forget. Grade a card and the interval adapts — easy words
                            drift far into the future, hard ones come back soon.
                        </p>
                        <div
                            aria-hidden
                            className="mt-auto flex items-center gap-2 pt-6"
                        >
                            {REVIEW_INTERVALS.map((interval, index) => (
                                <div
                                    key={interval}
                                    className="flex flex-1 flex-col items-center gap-1.5"
                                >
                                    <div
                                        className="h-1.5 w-full rounded-full gradient-accent"
                                        style={{ opacity: 0.35 + index * 0.16 }}
                                    />
                                    <span className="text-xs font-bold tabular-nums text-muted-foreground">
                                        {interval}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </BentoCard>

                    {/* Five practice modes */}
                    <BentoCard className="lg:row-span-2">
                        <IconChip gradient="gradient-accent">
                            <Sparkles className="h-5 w-5" aria-hidden />
                        </IconChip>
                        <h3 className="text-lg font-bold">Five practice modes</h3>
                        <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
                            Recognize it, spell it, hear it, pick it, and use it in
                            context — so a word works everywhere, not just on a card.
                        </p>
                        <ul className="mt-5 space-y-2.5">
                            {PRACTICE_MODES.map((mode) => (
                                <li
                                    key={mode.label}
                                    className="flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-2.5 text-sm font-semibold dark:bg-muted/30"
                                >
                                    <mode.icon
                                        className="h-4 w-4 shrink-0 text-primary"
                                        aria-hidden
                                    />
                                    {mode.label}
                                </li>
                            ))}
                        </ul>
                    </BentoCard>

                    {/* Streaks, XP, levels */}
                    <BentoCard>
                        <IconChip gradient="gradient-warm">
                            <Flame className="h-5 w-5" aria-hidden />
                        </IconChip>
                        <h3 className="text-lg font-bold">Streaks, XP &amp; levels</h3>
                        <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
                            Daily goals, streak flames, and levels that climb with
                            every session — motivation that shows up tomorrow too.
                        </p>
                        <div
                            aria-hidden
                            className="mt-auto flex flex-wrap items-center gap-2 pt-5"
                        >
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2.5 py-1 text-xs font-bold tabular-nums">
                                <Flame className="h-3.5 w-3.5 text-orange-500" />
                                12-day streak
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold tabular-nums">
                                <Trophy className="h-3.5 w-3.5 text-primary" />
                                Level 7
                            </span>
                        </div>
                    </BentoCard>

                    {/* Offline */}
                    <BentoCard>
                        <IconChip gradient="gradient-success">
                            <CloudOff className="h-5 w-5" aria-hidden />
                        </IconChip>
                        <h3 className="text-lg font-bold">Works offline</h3>
                        <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
                            Review on the subway or a flight — sessions run without a
                            connection and sync when you&apos;re back online.
                        </p>
                    </BentoCard>
                </div>
            </div>
        </section>
    );
}
