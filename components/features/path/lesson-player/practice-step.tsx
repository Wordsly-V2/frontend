"use client";

import VocabularyPractice from "@/components/features/vocabulary/vocabulary-practice";
import { usePracticeSessionPersistence } from "@/hooks/usePracticeSessionPersistence.hook";
import { buildPathPracticePlan } from "@/lib/path/item-to-word";
import type { ActivePracticeMode } from "@/lib/practice-settings";
import type { PathItem, PathItemRole } from "@/types/path/path.type";
import { useEffect, useState } from "react";

/**
 * PRACTICE (and WARMUP): the vocabulary engine, embedded. Answers keep every
 * rule of normal practice (worst attempt wins, offline queue, answer quality)
 * and are saved with `source: 'path'`, so they grade the items' FSRS cards.
 */
export function PracticeStep({
    items,
    modes,
    lessonTitle,
    subtitle,
    onExit,
    onDone,
}: Readonly<{
    items: (PathItem & { role?: PathItemRole })[];
    modes?: string[];
    lessonTitle: string;
    subtitle: string;
    onExit: () => void;
    onDone: () => void;
}>) {
    // Built once: the queue must not reshuffle under the learner.
    const [plan] = useState(() => buildPathPracticePlan(items));
    const { saveSession } = usePracticeSessionPersistence({
        courseId: "",
        wordIdList: plan.words.map((w) => w.id),
        progressByWordId: undefined,
        answerSource: "path",
        celebrate: false,
    });

    const empty = plan.queue.length === 0;
    useEffect(() => {
        if (empty) onDone();
    }, [empty, onDone]);

    if (empty) return null;

    return (
        <VocabularyPractice
            embedded
            words={plan.words}
            practiceQueue={plan.queue}
            stagesByWordId={plan.stagesByWordId}
            introSeenWordIds={plan.introSeenWordIds}
            modes={modes as ActivePracticeMode[] | undefined}
            courseName={lessonTitle}
            sessionSubtitle={subtitle}
            onExit={onExit}
            onSubmitResults={saveSession}
            onFinished={onDone}
        />
    );
}
