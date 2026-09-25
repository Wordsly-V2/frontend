"use client";

import { Button } from "@/components/ui/button";
import { buildDailyPlan, nextDailyStep, type DailyStep } from "@/lib/path/daily-plan";
import { cn } from "@/lib/utils";
import { usePathDueCountQuery } from "@/queries/path.query";
import type { PathMe, PathTree } from "@/types/path/path.type";
import { BookOpen, CheckCircle2, ClipboardCheck, RotateCcw } from "lucide-react";
import Link from "next/link";

/**
 * "Today" on /path: due reviews first, then the next lesson or unit test.
 * The step to do now is the button; the rest are listed for orientation.
 */
export function DailyPlanCard({ tree, me }: Readonly<{ tree: PathTree; me: PathMe }>) {
    const due = usePathDueCountQuery(me.enrolled);
    const plan = buildDailyPlan({ tree, me, dueSessionCount: due.data?.sessionCount });
    const next = nextDailyStep(plan);
    if (plan.length === 0) return null;

    return (
        <section aria-labelledby="daily-plan-title" className="glass-surface mb-8 rounded-3xl p-5 sm:p-6">
            <h2 id="daily-plan-title" className="font-display text-lg font-bold">
                Today
            </h2>
            <ol className="mt-3 space-y-2">
                {plan.map((step) => (
                    <DailyStepRow key={step.kind} step={step} current={step === next} />
                ))}
            </ol>
        </section>
    );
}

const ICONS = { review: RotateCcw, lesson: BookOpen, checkpoint: ClipboardCheck } as const;

function stepText(step: DailyStep): { title: string; detail: string; action: string } {
    switch (step.kind) {
        case "review":
            return step.done
                ? { title: "Review", detail: "All caught up", action: "Review" }
                : { title: "Review", detail: `${step.count} items are due`, action: "Start review" };
        case "lesson":
            return { title: step.title, detail: `${step.unitTitle} · ${step.minutes} min`, action: "Start lesson" };
        case "checkpoint":
            return { title: "Unit test", detail: `${step.unitTitle} · opens the next unit`, action: "Take the test" };
    }
}

function DailyStepRow({ step, current }: Readonly<{ step: DailyStep; current: boolean }>) {
    const done = step.kind === "review" && step.done;
    const Icon = done ? CheckCircle2 : ICONS[step.kind];
    const { title, detail, action } = stepText(step);

    return (
        <li
            className={cn(
                "flex items-center gap-3 rounded-2xl border-2 p-3",
                current ? "border-primary/40 bg-primary/5" : "border-transparent",
            )}
        >
            <Icon
                className={cn("h-5 w-5 shrink-0", done ? "text-[var(--brand-success)]" : "text-primary")}
                aria-hidden
            />
            <div className="min-w-0 flex-1">
                <p className={cn("truncate font-semibold", done && "text-muted-foreground")}>{title}</p>
                <p className="truncate text-sm text-muted-foreground">{detail}</p>
            </div>
            {current && (
                <Button variant="play" size="sm" asChild>
                    <Link href={step.href}>{action}</Link>
                </Button>
            )}
        </li>
    );
}
