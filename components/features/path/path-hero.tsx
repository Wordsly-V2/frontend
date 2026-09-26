"use client";

import { Button } from "@/components/ui/button";
import { CEFR_LABELS, findLesson, PATH_PLACEMENT_HREF, pathLessonHref } from "@/lib/path/path-tree";
import { useEnrollPathMutation } from "@/queries/path.query";
import type { PathMe, PathTree } from "@/types/path/path.type";
import { Compass, Play, Rocket, Trophy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

/** White pill button that sits on the gradient hero. */
const HERO_BUTTON =
    "glow-primary bg-white text-primary border-black/10 hover:bg-white hover:brightness-[1.02] dark:bg-white/90 dark:text-[oklch(from_var(--brand-primary)_0.42_0.16_h)] dark:hover:bg-white/90 focus-visible:ring-white/60 focus-visible:border-white";

/** Its quieter sibling: outlined, see-through. */
const HERO_BUTTON_OUTLINE =
    "border-2 border-white/50 bg-white/10 text-white shadow-none hover:bg-white/20 hover:text-white focus-visible:ring-white/60 focus-visible:border-white";

/**
 * Top of /path: the call to start the path, or where the learner is and a
 * button to take the next lesson.
 */
export function PathHero({ tree, me }: Readonly<{ tree: PathTree; me: PathMe }>) {
    return (
        <section
            aria-label="Your place on the path"
            className="gradient-hero relative mb-8 overflow-hidden rounded-3xl p-5 text-white shadow-chunky sm:p-7"
        >
            {me.enrolled ? <ContinueContent tree={tree} me={me} /> : <EnrollContent />}
        </section>
    );
}

function EnrollContent() {
    const enroll = useEnrollPathMutation();

    const start = () =>
        enroll.mutate(undefined, {
            onError: () => toast.error("Couldn't start the path. Please try again."),
        });

    return (
        <div className="flex flex-col gap-4">
            <div>
                <p className="text-sm font-semibold text-white/85">Wordsly Path</p>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    Learn English step by step
                </h1>
                <p className="mt-1.5 max-w-xl text-sm font-medium text-white/80">
                    Short lessons that take you from your first words to real
                    conversations. About 10 minutes a day.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant="play"
                    size="xl"
                    onClick={start}
                    disabled={enroll.isPending}
                    className={`w-fit gap-2 ${HERO_BUTTON}`}
                >
                    <Rocket className="h-5 w-5" aria-hidden />
                    {enroll.isPending ? "Starting…" : "Start from the beginning"}
                </Button>
                <Button variant="outline" size="xl" asChild className={`w-fit ${HERO_BUTTON_OUTLINE}`}>
                    <Link href={PATH_PLACEMENT_HREF} className="gap-2">
                        <Compass className="h-5 w-5" aria-hidden />
                        Find my level
                    </Link>
                </Button>
            </div>
        </div>
    );
}

function ContinueContent({ tree, me }: Readonly<{ tree: PathTree; me: PathMe }>) {
    const { completedLessonCount: done, totalLessonCount: total, currentLessonId } =
        me.progress;
    const next = findLesson(tree, currentLessonId);
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <div className="flex flex-col gap-5">
            <div>
                <p className="text-sm font-semibold text-white/85">
                    {next
                        ? `${CEFR_LABELS[next.stage.cefr]} · Unit ${next.unit.order}: ${next.unit.title}`
                        : "Wordsly Path"}
                </p>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {next ? next.lesson.title : "You're all caught up"}
                </h1>
                <p className="mt-1.5 text-sm font-medium text-white/80">
                    {next
                        ? `${next.lesson.titleVi} · ${next.lesson.estimatedMinutes} min · ${next.lesson.newItemCount} new`
                        : "The next unit opens after its unit test. More lessons are on the way."}
                </p>
            </div>

            <div className="max-w-md">
                <div className="mb-1.5 flex justify-between text-xs font-bold text-white/85 tabular-nums">
                    <span>
                        {done} of {total} lessons
                    </span>
                    <span>{percent}%</span>
                </div>
                <div
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${done} of ${total} lessons done`}
                    className="h-2.5 overflow-hidden rounded-full bg-white/20"
                >
                    <div
                        className="h-full rounded-full bg-white transition-[width] duration-700"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {next ? (
                    <Button variant="play" size="xl" asChild className={`w-fit ${HERO_BUTTON}`}>
                        <Link href={pathLessonHref(next.lesson.id)} className="gap-2">
                            <Play className="h-5 w-5 fill-current" aria-hidden />
                            {done === 0 ? "Start first lesson" : "Continue"}
                        </Link>
                    </Button>
                ) : (
                    <p className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold">
                        <Trophy className="h-4 w-4" aria-hidden />
                        Great work so far!
                    </p>
                )}
                {/* Enrolled straight in and not started yet: offer to skip ahead. */}
                {done === 0 && !me.startUnitId && (
                    <Link
                        href={PATH_PLACEMENT_HREF}
                        className="text-sm font-bold text-white/85 underline underline-offset-4 hover:text-white"
                    >
                        Know some already? Find your level
                    </Link>
                )}
            </div>
        </div>
    );
}
