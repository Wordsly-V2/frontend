"use client";

import { StepFooter } from "@/components/features/path/lesson-player/step-footer";
import { Button } from "@/components/ui/button";
import type { PathItem } from "@/types/path/path.type";
import { Eye } from "lucide-react";

/**
 * Stand-ins for what a preview can't run without saving: WARMUP and PRACTICE
 * run the practice engine, which grades FSRS cards and records the day.
 */
export function PreviewSkippedStep({
    title,
    detail,
    items,
    onDone,
}: Readonly<{ title: string; detail: string; items?: PathItem[]; onDone: () => void }>) {
    return (
        <div>
            <article className="surface-card space-y-3 p-5 sm:p-7">
                <header className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <Eye className="h-5 w-5" aria-hidden />
                    </div>
                    <h2 className="font-display text-xl font-bold">{title}</h2>
                </header>
                <p className="text-sm text-muted-foreground">{detail}</p>
                {items && items.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                        {items.map((item) => (
                            <li key={item.id} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium">
                                {item.text}
                            </li>
                        ))}
                    </ul>
                )}
            </article>
            <StepFooter onClick={onDone} />
        </div>
    );
}

/** The end of a preview: nothing was saved, so no progress and no next lesson. */
export function PreviewEnd({ scorePercent, onExit }: Readonly<{ scorePercent: number | undefined; onExit: () => void }>) {
    return (
        <section className="surface-card flex flex-col items-center gap-4 p-6 text-center">
            <h2 className="font-display text-2xl font-bold">End of the lesson</h2>
            <p className="text-sm text-muted-foreground">
                {scorePercent === undefined ? "No quiz in this lesson." : `Quiz: ${scorePercent}%.`} Nothing was saved.
            </p>
            <Button variant="play" size="lg" onClick={onExit}>
                Close preview
            </Button>
        </section>
    );
}
