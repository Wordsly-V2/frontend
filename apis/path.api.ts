import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type {
    CompletePathLessonDto,
    CompletePathLessonResult,
    PathLessonView,
    PathMe,
    PathTree,
    PathUnitView,
} from "@/types/path/path.type";

/** The path map, or null while nothing has been published yet (404). */
export const getPathTree = (): Promise<PathTree | null> =>
    request((i) => i.get(apiPaths.path.tree()), { notFoundAsNull: true });

export const getPathMe = (): Promise<PathMe> =>
    request((i) => i.get(apiPaths.path.me()));

/** Idempotent: enrolling twice returns the same state. */
export const enrollPath = (): Promise<PathMe> =>
    request((i) => i.post(apiPaths.path.enroll()));

/** 403 while the unit is locked. */
export const getPathUnit = (unitId: string): Promise<PathUnitView> =>
    request((i) => i.get(apiPaths.path.unit(unitId)));

/** 403 while the lesson is locked. */
export const getPathLesson = (lessonId: string): Promise<PathLessonView> =>
    request((i) => i.get(apiPaths.path.lesson(lessonId)));

export const completePathLesson = (
    lessonId: string,
    body: CompletePathLessonDto,
): Promise<CompletePathLessonResult> =>
    request((i) => i.post(apiPaths.path.completeLesson(lessonId), body));
