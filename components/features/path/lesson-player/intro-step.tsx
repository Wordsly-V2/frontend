"use client";

import { PathItemCard } from "@/components/features/path/path-item-card";
import { StepFooter } from "@/components/features/path/lesson-player/step-footer";
import type { PathItem } from "@/types/path/path.type";
import { useState } from "react";

/** INTRO: the lesson's new items, one card at a time. */
export function IntroStep({ items, onDone }: Readonly<{ items: PathItem[]; onDone: () => void }>) {
    const [index, setIndex] = useState(0);
    const item = items[index];
    const last = index >= items.length - 1;

    // The player never renders an empty step.
    if (!item) return null;

    return (
        <div>
            <p className="mb-3 text-sm font-semibold text-muted-foreground">
                New {index + 1} of {items.length}
            </p>
            <PathItemCard key={item.id} item={item} />
            <StepFooter
                label={last ? "Continue" : "Next"}
                onClick={() => (last ? onDone() : setIndex(index + 1))}
            />
        </div>
    );
}
