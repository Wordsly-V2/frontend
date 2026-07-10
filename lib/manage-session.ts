/**
 * Remembers the last course opened in Manage — used for "Continue editing".
 */
import { createLastCourseStore, type LastCourse } from "@/lib/last-course";

export const LAST_MANAGE_COURSE_KEY = "wordsly.lastManageCourse";

export type LastManageCourse = LastCourse;

const store = createLastCourseStore(LAST_MANAGE_COURSE_KEY);

export const getLastManageCourse = store.get;
export const setLastManageCourse = store.set;
