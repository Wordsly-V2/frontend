import {
    bulkDeleteMyWords,
    bulkDeleteMyWordsFromCourse,
    bulkMoveMyWords,
    bulkMoveMyWordsFromCourse,
    createMyWord,
    deleteMyWord,
    moveMyWord,
    updateMyWord,
} from "@/apis/words.api";
import { CreateMyWord } from "@/types/courses/courses.type";
import { useMutation } from "@tanstack/react-query";

export const useWords = () => {
    const mutationCreateMyWord = useMutation({
        mutationFn: ({ courseId, lessonId, word }: { courseId: string, lessonId: string, word: CreateMyWord }) => createMyWord(courseId, lessonId, word),
    });

    const mutationUpdateMyWord = useMutation({
        mutationFn: ({ courseId, lessonId, wordId, word }: { courseId: string, lessonId: string, wordId: string, word: CreateMyWord }) => updateMyWord(courseId, lessonId, wordId, word),
    });

    const mutationDeleteMyWord = useMutation({
        mutationFn: ({ courseId, lessonId, wordId }: { courseId: string, lessonId: string, wordId: string }) => deleteMyWord(courseId, lessonId, wordId),
    });

    const mutationMoveMyWord = useMutation({
        mutationFn: ({ courseId, lessonId, wordId, targetLessonId, targetCourseId }: { courseId: string, lessonId: string, wordId: string, targetLessonId: string, targetCourseId?: string }) => moveMyWord(courseId, lessonId, wordId, targetLessonId, targetCourseId),
    });

    const mutationBulkDeleteMyWords = useMutation({
        mutationFn: ({ courseId, lessonId, wordIds }: { courseId: string, lessonId: string, wordIds: string[] }) => bulkDeleteMyWords(courseId, lessonId, wordIds),
    });

    const mutationBulkMoveMyWords = useMutation({
        mutationFn: ({ courseId, lessonId, wordIds, targetLessonId, targetCourseId }: { courseId: string, lessonId: string, wordIds: string[], targetLessonId: string, targetCourseId?: string }) => bulkMoveMyWords(courseId, lessonId, wordIds, targetLessonId, targetCourseId),
    });

    const mutationBulkDeleteMyWordsFromCourse = useMutation({
        mutationFn: ({ courseId, wordIds }: { courseId: string; wordIds: string[] }) => bulkDeleteMyWordsFromCourse(courseId, wordIds),
    });

    const mutationBulkMoveMyWordsFromCourse = useMutation({
        mutationFn: ({ courseId, wordIds, targetLessonId }: { courseId: string; wordIds: string[]; targetLessonId: string }) => bulkMoveMyWordsFromCourse(courseId, wordIds, targetLessonId),
    });

    return {
        mutationCreateMyWord,
        mutationUpdateMyWord,
        mutationDeleteMyWord,
        mutationMoveMyWord,
        mutationBulkDeleteMyWords,
        mutationBulkMoveMyWords,
        mutationBulkDeleteMyWordsFromCourse,
        mutationBulkMoveMyWordsFromCourse,
    };
};