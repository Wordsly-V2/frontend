import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    Brain,
    Flame,
    Settings,
    Sparkles,
    Volume2,
} from "lucide-react";
import Link from "next/link";

const MOCK_GRADES = [
    { label: "Again", className: "bg-rose-500/12 text-rose-600 dark:text-rose-400" },
    { label: "Hard", className: "bg-amber-500/12 text-amber-600 dark:text-amber-400" },
    { label: "Good", className: "bg-primary/12 text-primary" },
    { label: "Easy", className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
] as const;

/** Decorative product mock — a stylized flashcard mid-review. Static, no data. */
function HeroFlashcard() {
    return (
        <div
            aria-hidden
            className="relative mx-auto w-full max-w-sm select-none lg:max-w-md"
        >
            {/* Colored halo behind the card */}
            <div className="absolute -inset-8 rounded-[3rem] gradient-hero opacity-25 blur-3xl" />

            {/* Floating stat chips */}
            <div className="glass-surface absolute -top-5 right-2 z-10 flex rotate-3 items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-extrabold shadow-lg">
                <Flame className="h-4 w-4 text-orange-500" />
                12-day streak
            </div>
            <div className="glass-surface absolute -bottom-5 left-2 z-10 flex -rotate-2 items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-extrabold shadow-lg">
                <Sparkles className="h-4 w-4 text-primary" />
                +10 XP · Level 7
            </div>

            {/* The flashcard itself */}
            <div className="glass-surface relative rounded-3xl p-6 shadow-xl sm:p-7">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        <Brain className="h-3.5 w-3.5" />
                        Flashcard
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full gradient-accent text-white shadow-sm">
                        <Volume2 className="h-4 w-4" />
                    </span>
                </div>

                <div className="mt-6">
                    <p className="font-display text-4xl font-extrabold tracking-tight">
                        serendipity
                    </p>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">
                        /ˌsɛr.ənˈdɪp.ə.ti/
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                        finding something wonderful without looking for it
                    </p>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-2 border-t border-border/60 pt-5">
                    {MOCK_GRADES.map((grade) => (
                        <span
                            key={grade.label}
                            className={cn(
                                "rounded-xl px-1 py-2 text-center text-xs font-extrabold",
                                grade.className,
                            )}
                        >
                            {grade.label}
                        </span>
                    ))}
                </div>

                <p className="mt-4 text-center text-xs font-medium text-muted-foreground">
                    Next review · in 4 days, right before you&apos;d forget
                </p>
            </div>
        </div>
    );
}

interface LandingHeroProps {
    signedIn: boolean;
}

export function LandingHero({ signedIn }: Readonly<LandingHeroProps>) {
    return (
        <section className="relative overflow-hidden">
            {/* Aurora backdrop washes */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -top-32 right-[-12%] h-[26rem] w-[26rem] rounded-full bg-[var(--brand-primary)]/20 blur-3xl" />
                <div className="absolute top-1/2 left-[-14%] h-80 w-80 rounded-full bg-[var(--brand-secondary)]/18 blur-3xl" />
                <div className="absolute bottom-[-20%] left-1/2 h-72 w-72 rounded-full bg-[var(--brand-accent)]/12 blur-3xl" />
            </div>

            <div className="container mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
                <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
                    <div className="animate-fade-up">
                        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full glass-surface px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Brain className="h-3.5 w-3.5 text-primary" aria-hidden />
                            FSRS spaced repetition · A2–C1
                        </p>
                        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                            Learn words that{" "}
                            <span className="text-gradient-brand">stick for good.</span>
                        </h1>
                        <p className="mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
                            Wordsly schedules every review just before you forget, mixes
                            five practice modes so words never go stale, and keeps working
                            when your connection doesn&apos;t.
                        </p>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            <Button
                                size="xl"
                                variant="play"
                                className="w-full glow-primary sm:w-auto"
                                asChild
                            >
                                <Link href="/learn">
                                    <BookOpen className="h-5 w-5" aria-hidden />
                                    Start learning
                                </Link>
                            </Button>
                            <Button
                                size="xl"
                                variant="playOutline"
                                className="w-full sm:w-auto"
                                asChild
                            >
                                <Link href="/manage">
                                    <Settings className="h-5 w-5" aria-hidden />
                                    Manage courses
                                </Link>
                            </Button>
                        </div>
                        {!signedIn && (
                            <p className="mt-6 text-sm text-muted-foreground">
                                New here?{" "}
                                <Link
                                    href="/auth/login"
                                    className="font-semibold text-primary underline-offset-4 hover:underline"
                                >
                                    Sign in
                                </Link>{" "}
                                to sync progress across devices.
                            </p>
                        )}
                    </div>

                    <div className="animate-fade-up py-6 lg:py-0">
                        <HeroFlashcard />
                    </div>
                </div>
            </div>
        </section>
    );
}
