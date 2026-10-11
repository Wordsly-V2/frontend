import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const IMPORT_STEPS = [
    { key: "source", label: "Add words" },
    { key: "review", label: "Review" },
    { key: "done", label: "Done" },
] as const;
export type ImportStep = (typeof IMPORT_STEPS)[number]["key"];

/** Where the learner is in the import: "Step 2 of 3" for screen readers, dots and labels for the eye. */
export function ImportSteps({ current }: Readonly<{ current: ImportStep }>) {
    const index = IMPORT_STEPS.findIndex((step) => step.key === current);
    return (
        <nav aria-label="Import steps">
            <ol className="flex items-center gap-2 sm:gap-3">
                {IMPORT_STEPS.map((step, i) => {
                    const done = i < index;
                    const active = i === index;
                    return (
                        <li key={step.key} className="flex min-w-0 items-center gap-2 sm:gap-3">
                            <span
                                aria-current={active ? "step" : undefined}
                                className={cn(
                                    "flex items-center gap-2 text-sm font-semibold",
                                    active ? "text-foreground" : "text-muted-foreground",
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold tabular-nums transition-colors",
                                        done && "border-primary bg-primary text-primary-foreground",
                                        active && "border-primary text-primary",
                                        !done && !active && "border-border",
                                    )}
                                >
                                    {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                                </span>
                                <span className={cn(!active && "hidden sm:inline")}>
                                    {step.label}
                                    <span className="sr-only">
                                        {` (step ${i + 1} of ${IMPORT_STEPS.length}${done ? ", done" : ""})`}
                                    </span>
                                </span>
                            </span>
                            {i < IMPORT_STEPS.length - 1 && (
                                <span
                                    aria-hidden
                                    className={cn("h-0.5 w-6 rounded-full sm:w-10", done ? "bg-primary" : "bg-border")}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
