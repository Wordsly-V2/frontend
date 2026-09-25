"use client";

import { MiniMarkdown } from "@/components/features/path/mini-markdown";
import { ExampleLine } from "@/components/features/path/path-speech";
import { StepFooter } from "@/components/features/path/lesson-player/step-footer";
import type { PathExample } from "@/types/path/path.type";
import { BookOpenText } from "lucide-react";

/** EXPLAIN: a short grammar or pattern note in Vietnamese, with examples. */
export function ExplainStep({
    titleVi,
    bodyVi,
    examples,
    onDone,
}: Readonly<{ titleVi: string; bodyVi: string; examples?: PathExample[]; onDone: () => void }>) {
    return (
        <div>
            <article className="glass-surface space-y-4 rounded-3xl p-5 sm:p-7">
                <header className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-brand text-primary-foreground">
                        <BookOpenText className="h-5 w-5" aria-hidden />
                    </div>
                    <h2 className="font-display text-xl font-bold sm:text-2xl">{titleVi}</h2>
                </header>
                <MiniMarkdown source={bodyVi} />
                {examples && examples.length > 0 && (
                    <section className="space-y-3 border-t border-border pt-4">
                        {examples.map((example) => (
                            <ExampleLine key={example.en} example={example} />
                        ))}
                    </section>
                )}
            </article>
            <StepFooter label="Got it" onClick={onDone} />
        </div>
    );
}
