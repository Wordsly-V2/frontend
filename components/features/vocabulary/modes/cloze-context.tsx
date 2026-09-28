"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import type { ClozeContext } from "@/lib/practice-utils";
import { cn } from "@/lib/utils";

/**
 * A fill-in sentence with what the learner needs to pick one answer. A dialogue
 * turn shows as chat bubbles (the blanked line on the learner's side) under its
 * situation; otherwise the sentence alone. The translation, when there is one,
 * sits underneath as the clue. Without `context` it is just the sentence.
 */
export function ClozeContextView({
    sentence,
    context,
    className,
}: Readonly<{ sentence: string; context?: ClozeContext; className?: string }>) {
    const lines = context?.lines ?? [];

    return (
        <div className={cn("space-y-3", className)}>
            {context?.situationVi && (
                <p className="text-center text-sm text-muted-foreground">{context.situationVi}</p>
            )}

            {lines.length > 0 ? (
                <ol className="mx-auto max-w-md space-y-2 text-left">
                    {lines.map((line, i) => (
                        <li
                            key={i}
                            className={cn("flex", line.target ? "justify-end" : "justify-start")}
                        >
                            <div
                                className={cn(
                                    "max-w-[85%] space-y-0.5 rounded-2xl px-4 py-2.5",
                                    line.target
                                        ? "rounded-br-md bg-primary/10 ring-1 ring-primary/25"
                                        : "rounded-bl-md bg-muted",
                                )}
                            >
                                <p className="text-xs font-bold text-muted-foreground">
                                    {line.speaker}
                                </p>
                                <p
                                    className={cn(
                                        "break-words",
                                        line.target
                                            ? "text-lg font-semibold text-foreground"
                                            : "text-foreground/80",
                                    )}
                                >
                                    {line.en}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            ) : (
                <AdaptiveText
                    text={sentence}
                    role="sentence"
                    align="center"
                    className="px-2 text-foreground/90"
                />
            )}

            {context?.translationVi && (
                <p className="text-center text-sm italic text-muted-foreground">
                    {context.translationVi}
                </p>
            )}
        </div>
    );
}
