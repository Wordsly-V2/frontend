import { createSerializer, parseAsArrayOf, parseAsString } from "nuqs/server";

export const wordSelectionSearchParams = {
    courseId: parseAsString,
    courseName: parseAsString,
    wordIds: parseAsArrayOf(parseAsString),
};

const serializeWordSelection = createSerializer(wordSelectionSearchParams);

export function buildWordsDetailsUrl(params: {
    courseId: string;
    courseName: string;
    wordIds: string[];
}): string {
    return serializeWordSelection("/learn/words-details", {
        courseId: params.courseId,
        courseName: params.courseName,
        wordIds: params.wordIds,
    });
}
