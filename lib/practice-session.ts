import { createSerializer, parseAsStringLiteral } from "nuqs/server";
import { wordSelectionSearchParams } from "@/lib/search-params/word-selection";

export type PracticeSessionKind = "new" | "review";

export const practiceSessionSearchParams = {
    ...wordSelectionSearchParams,
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
