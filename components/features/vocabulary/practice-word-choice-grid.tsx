"use client";

import { AdaptiveText } from "@/components/common/adaptive-text";
import { cn } from "@/lib/utils";

interface PracticeWordChoiceGridProps {
    options: string[];
    onSelect: (option: string) => void;
    disabled?: boolean;
    selectedOption?: string | null;
}

/**
 * Answer tiles for the multiple-choice modes: chunky, pressable, with the
 * keyboard letter (a–d, wired in the engine) on each. Two columns when there is
 * room, so four options read as a square instead of a long list.
 */
export function PracticeWordChoiceGrid({
    options,
    onSelect,
    disabled = false,
    selectedOption = null,
}: Readonly<PracticeWordChoiceGridProps>) {
    return (
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
            {options.map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                const selected = selectedOption === option && !disabled;
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => !disabled && onSelect(option)}
                        disabled={disabled}
                        aria-pressed={selectedOption != null ? selected : undefined}
                        className={cn(
                            "group flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-b-4 px-3.5 py-3 text-left transition-[background-color,border-color,transform] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 active:translate-y-[2px] active:border-b-2 disabled:pointer-events-none disabled:opacity-60 motion-reduce:active:translate-y-0",
                            selected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                        )}
                    >
                        <span
                            aria-hidden
                            className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-xs font-extrabold transition-colors",
                                selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary",
                            )}
                        >
                            {letter}
                        </span>
                        <AdaptiveText
                            text={option}
                            role="word"
                            as="span"
                            className="flex-1 !text-base sm:!text-lg !font-semibold"
                            scrollWhenLong={false}
                        />
                    </button>
                );
            })}
        </div>
    );
}
