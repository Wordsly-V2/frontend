"use client";

import { PracticeStep } from "@/components/features/path/lesson-player/practice-step";
import { usePathWarmupQuery } from "@/queries/path.query";
import { Skeleton } from "@/components/common/states";
import { useEffect } from "react";

/**
 * WARMUP: a quick review of Path items that are due, before the new material.
 * Skipped when nothing is due, and when the due list can't be fetched
 * (offline): a warm-up is a bonus, never a blocker.
 */
export function WarmupStep({
    lessonId,
    maxItems,
    lessonTitle,
    onExit,
    onDone,
}: Readonly<{
    lessonId: string;
    maxItems: number;
    lessonTitle: string;
    onExit: () => void;
    onDone: () => void;
}>) {
    const warmup = usePathWarmupQuery(lessonId, maxItems);
    const skip = warmup.isError || (warmup.isSuccess && warmup.data.length === 0);

    useEffect(() => {
        if (skip) onDone();
    }, [skip, onDone]);

    if (!warmup.data || warmup.data.length === 0) {
        return skip ? null : <Skeleton aria-busy className="h-80 w-full rounded-3xl" />;
    }

    return (
        <PracticeStep
            items={warmup.data}
            lessonTitle={lessonTitle}
            subtitle="Warm-up review"
            onExit={onExit}
            onDone={onDone}
        />
    );
}
