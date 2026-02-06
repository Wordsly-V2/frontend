import { bulkDeleteMyWords, bulkMoveMyWords, createMyWord, deleteMyWord, fetchWordDetailsDictionary, moveMyWord, updateMyWord } from "@/apis/words.api";
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
        mutationFn: ({ courseId, lessonId, wordId, targetLessonId }: { courseId: string, lessonId: string, wordId: string, targetLessonId: string }) => moveMyWord(courseId, lessonId, wordId, targetLessonId),
    });

    const mutationBulkDeleteMyWords = useMutation({
        mutationFn: ({ courseId, lessonId, wordIds }: { courseId: string, lessonId: string, wordIds: string[] }) => bulkDeleteMyWords(courseId, lessonId, wordIds),
    });

    const mutationBulkMoveMyWords = useMutation({
        mutationFn: ({ courseId, lessonId, wordIds, targetLessonId }: { courseId: string, lessonId: string, wordIds: string[], targetLessonId: string }) => bulkMoveMyWords(courseId, lessonId, wordIds, targetLessonId),
    });

    const mutationFetchWordDetailsDictionary = useMutation({
        mutationFn: (word: string) => fetchWordDetailsDictionary(word),
    });

    return { mutationCreateMyWord, mutationUpdateMyWord, mutationDeleteMyWord, mutationMoveMyWord, mutationBulkDeleteMyWords, mutationBulkMoveMyWords, mutationFetchWordDetailsDictionary };
};