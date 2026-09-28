"use client";

import VocabularyPractice from "@/components/features/vocabulary/vocabulary-practice";
import { usePracticeSessionPersistence } from "@/hooks/usePracticeSessionPersistence.hook";
import { buildPathPracticePlan } from "@/lib/path/item-to-word";
import type { ActivePracticeMode } from "@/lib/practice-settings";
import type { PathDialogue, PathItem, PathItemRole } from "@/types/path/path.type";
import type { SessionCompletePayload } from "@/types/practice/practice.type";
import { useEffect, useState } from "react";

/**
 * PRACTICE (and WARMUP): the vocabulary engine, embedded. Answers keep every
 * rule of normal practice (worst attempt wins, offline queue, answer quality)
 * and are saved with `source: 'path'`, so they grade the items' FSRS cards.
 */
export function PracticeStep({
    items,
    modes,
    dialogues,
    lessonTitle,
    subtitle,
    onExit,
    onDone,
}: Readonly<{
    items: (PathItem & { role?: PathItemRole })[];
    modes?: string[];
    /** The lesson's dialogues: fill-ins can be set in one of their turns. */
    dialogues?: PathDialogue[];
    lessonTitle: string;
    subtitle: string;
    onExit: () => void;
    /** The session's results; none when there was nothing to drill. */
    onDone: (payload?: SessionCompletePayload) => void;
}>) {
    // Built once: the queue must not reshuffle under the learner.
    const [plan] = useState(() => buildPathPracticePlan(items, dialogues));
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
            itemSource="path"
            words={plan.words}
            practiceQueue={plan.queue}
            stagesByWordId={plan.stagesByWordId}
            introSeenWordIds={plan.introSeenWordIds}
            clozePromptsByWordId={plan.clozePromptsByWordId}
            modes={modes as ActivePracticeMode[] | undefined}
            courseName={lessonTitle}
            sessionSubtitle={subtitle}
            onExit={onExit}
            onSubmitResults={saveSession}
            onFinished={onDone}
        />
    );
}
