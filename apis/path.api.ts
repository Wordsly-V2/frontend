import { apiPaths } from "@/lib/api-paths";
import { request } from "@/lib/axios";
import type {
    CompletePathLessonDto,
    PathItem,
    CompletePathLessonResult,
    PathCheckpointResult,
    PathCheckpointView,
    PathLessonView,
    PathMe,
    PathPlacementResult,
    PathPlacementView,
    PathTree,
    PathUnitView,
    SubmitPathCheckpointDto,
    SubmitPathPlacementDto,
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

/** The unit test without its answers. 403 until every lesson of the unit is done. */
export const getPathCheckpoint = (unitId: string): Promise<PathCheckpointView> =>
    request((i) => i.get(apiPaths.path.checkpoint(unitId)));

/** Graded on the server; 409 when a newer release replaced the questions. */
export const submitPathCheckpoint = (
    unitId: string,
    body: SubmitPathCheckpointDto,
): Promise<PathCheckpointResult> =>
    request((i) => i.post(apiPaths.path.submitCheckpoint(unitId), body));

/** The placement test without its answers, or null when none is published (404). */
export const getPathPlacement = (): Promise<PathPlacementView | null> =>
    request((i) => i.get(apiPaths.path.placement()), { notFoundAsNull: true });

/** Graded on the server; enrolls and moves the start unit forward. 409 on a newer release. */
export const submitPathPlacement = (
    body: SubmitPathPlacementDto,
): Promise<PathPlacementResult> =>
    request((i) => i.post(apiPaths.path.submitPlacement(), body));

/** Published items by id (unknown or retired ids are left out). */
export const hydratePathItems = (itemIds: string[]): Promise<PathItem[]> =>
    request((i) => i.post(apiPaths.path.hydrateItems(), { itemIds }));
