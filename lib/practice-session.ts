import { createSerializer, parseAsStringLiteral } from "nuqs/server";
import { wordSelectionSearchParams } from "@/lib/search-params/word-selection";

export type PracticeSessionKind = "new" | "review" | "leech";

export const practiceSessionSearchParams = {
    ...wordSelectionSearchParams,
    kind: parseAsStringLiteral(["new", "review", "leech"] as const).withDefault("new"),
};

const serializePracticeSession = createSerializer(practiceSessionSearchParams);

export function buildPracticeUrl(params: {
    /** Omit for an all-courses session (e.g. review due words across every course). */
    courseId?: string;
    courseName?: string;
    wordIds: string[];
    kind?: PracticeSessionKind;
}): string {
    return serializePracticeSession("/learn/practice", {
        courseId: params.courseId ?? null,
        courseName: params.courseName ?? null,
        wordIds: params.wordIds,
        kind: params.kind ?? "new",
    });
}
