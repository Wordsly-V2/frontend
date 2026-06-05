import {
    useGetProgressByWordIdsQuery,
    useGetProgressStatsByLessonIdsQuery,
    useGetProgressStatsByWordIdsQuery,
} from "@/queries/word-progress.query";
import type { ICourse } from "@/types/courses/courses.type";
import type {
    IWordProgressResponse,
    IWordProgressStats,
} from "@/types/word-progress/word-progress.type";
import { useMemo } from "react";

export function useCourseWordProgress(course: ICourse | undefined, enabled = true) {
    const lessonIds = useMemo(
        () => course?.lessons?.map((lesson) => lesson.id) ?? [],
        [course?.lessons],
    );
    const wordIds = useMemo(
        () =>
            course?.lessons?.flatMap(
                (lesson) => lesson.words?.map((word) => word.id) ?? [],
            ) ?? [],
        [course?.lessons],
    );

    const courseStatsQuery = useGetProgressStatsByWordIdsQuery(
        wordIds,
        enabled && wordIds.length > 0,
    );
    const lessonStatsQuery = useGetProgressStatsByLessonIdsQuery(
        lessonIds,
        enabled && lessonIds.length > 0,
    );
    const wordProgressQuery = useGetProgressByWordIdsQuery(
        wordIds,
        enabled && wordIds.length > 0,
    );

    return {
        courseStats: courseStatsQuery.data as IWordProgressStats | undefined,
        lessonStatsByLessonId: lessonStatsQuery.data ?? {},
        wordProgressByWordId:
            (wordProgressQuery.data ?? {}) as Record<
                string,
                IWordProgressResponse | null
            >,
        isLoading:
            courseStatsQuery.isLoading ||
            lessonStatsQuery.isLoading ||
            wordProgressQuery.isLoading,
        isError:
            courseStatsQuery.isError ||
            lessonStatsQuery.isError ||
            wordProgressQuery.isError,
        refetch: () => {
            void courseStatsQuery.refetch();
            void lessonStatsQuery.refetch();
            void wordProgressQuery.refetch();
        },
    };
}
