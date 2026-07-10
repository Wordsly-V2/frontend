/**
 * Remembers the last course the learner opened in Learn — used for "Continue" and quick review.
 */
import { createLastCourseStore, type LastCourse } from "@/lib/last-course";

export const LAST_LEARN_COURSE_KEY = "wordsly.lastLearnCourse";

export type LastLearnCourse = LastCourse;

const store = createLastCourseStore(LAST_LEARN_COURSE_KEY);

export const getLastLearnCourse = store.get;
export const setLastLearnCourse = store.set;
