import {
    createSerializer,
    parseAsArrayOf,
    parseAsString,
    parseAsStringLiteral,
} from "nuqs/server";

export type PracticeSessionKind = "new" | "review";

export const practiceSessionSearchParams = {
    courseId: parseAsString,
    courseName: parseAsString,
    wordIds: parseAsArrayOf(parseAsString),
    kind: parseAsStringLiteral(["new", "review"] as const).withDefault("new"),
};

const serializePracticeSession = createSerializer(practiceSessionSearchParams);

export function buildPracticeUrl(params: {
    courseId: string;
    courseName: string;
    wordIds: string[];
    kind?: PracticeSessionKind;
}): string {
    return serializePracticeSession("/learn/practice", {
        courseId: params.courseId,
        courseName: params.courseName,
        wordIds: params.wordIds,
        kind: params.kind ?? "new",
    });
}
