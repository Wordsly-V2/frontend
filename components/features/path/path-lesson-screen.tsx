"use client";

import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { LessonPlayer } from "@/components/features/path/lesson-player/lesson-player";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { usePathLessonQuery } from "@/queries/path.query";
import { Lock } from "lucide-react";
import Link from "next/link";

/** /path/lesson/[lessonId]: loads the lesson, then hands it to the player. */
export function PathLessonScreen({ lessonId }: Readonly<{ lessonId: string }>) {
    const lesson = usePathLessonQuery(lessonId);

    if (!lesson.data && lesson.isFetching) {
        return (
            <div aria-busy className="space-y-5">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
        );
    }

    if (!lesson.data) {
        const status = lesson.error instanceof ApiError ? lesson.error.status : undefined;
        const back = (
            <Button variant="play" asChild>
                <Link href="/path">Back to the path</Link>
            </Button>
        );
        if (status === 403) {
            return (
                <EmptyState
                    icon={Lock}
                    title="This lesson is locked"
                    description="Finish the lessons before it to open this one."
                    action={back}
                />
            );
        }
        if (status === 404) {
            return (
                <EmptyState
                    title="Lesson not found"
                    description="It may have moved in a newer version of the path."
                    action={back}
                />
            );
        }
        return <ErrorState message="Couldn't load this lesson." onRetry={() => void lesson.refetch()} />;
    }

    return <LessonPlayer key={lesson.data.lesson.id} lesson={lesson.data.lesson} />;
}
