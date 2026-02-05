import { createMyWord, deleteMyWord, updateMyWord } from "@/apis/words.api";
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

    return { mutationCreateMyWord, mutationUpdateMyWord, mutationDeleteMyWord };
};