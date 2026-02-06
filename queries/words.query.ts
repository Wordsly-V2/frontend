import { getWordsByIds } from "@/apis/words.api";
import { IWord } from "@/types/courses/courses.type";
import { useQuery } from "@tanstack/react-query";

export const useGetWordsByIdsQuery = (courseId: string, wordIds: string[] = []) => useQuery<IWord[]>({
    queryKey: ['words', 'get', courseId, wordIds],
    queryFn: () => getWordsByIds(courseId, wordIds),
});
