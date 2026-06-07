import { createSerializer, parseAsString } from "nuqs/server";

export const courseWordFocusSearchParams = {
    word: parseAsString,
    lessonId: parseAsString,
};

const serializeCourseWordFocus = createSerializer(courseWordFocusSearchParams);

export function buildLearnCourseWordUrl(
    courseId: string,
    params: { word: string; lessonId: string },
): string {
    return serializeCourseWordFocus(`/learn/courses/${courseId}`, params);
}

export function buildManageCourseWordUrl(
    courseId: string,
    params: { word: string; lessonId: string },
): string {
    return serializeCourseWordFocus(`/manage/courses/${courseId}`, params);
}
