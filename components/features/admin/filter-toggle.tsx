"use client";

import { Button } from "@/components/ui/button";

interface FilterToggleProps<T extends string> {
    label: string;
    /** `null` is the "All" option. */
    value: T | null;
    options: readonly { value: T | null; label: string }[];
    onChange: (value: T | null) => void;
}

/** A small segmented control for list filters, styled like the report period toggle. */
export function FilterToggle<T extends string>({ label, value, options, onChange }: Readonly<FilterToggleProps<T>>) {
    return (
        <div
            role="radiogroup"
            aria-label={label}
            className="flex items-center rounded-xl border border-border/70 bg-muted/40 p-0.5 dark:bg-muted/25"
        >
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <Button
                        key={option.label}
                        role="radio"
                        aria-checked={active}
                        variant={active ? "default" : "ghost"}
                        size="sm"
                        className={`rounded-lg px-3 ${active ? "shadow-sm" : ""}`}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </Button>
                );
            })}
        </div>
    );
}
