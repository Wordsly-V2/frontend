export type PracticeSessionKind = "new" | "review";

export function parsePracticeSessionKind(raw: string | null): PracticeSessionKind {
    return raw === "review" ? "review" : "new";
}

export function buildPracticeUrl(params: {
    courseId: string;
    courseName: string;
    wordIds: string[];
    kind?: PracticeSessionKind;
}): string {
    const kind = params.kind ?? "new";
    const wordIds = params.wordIds.join(",");
    return `/learn/practice?courseId=${params.courseId}&courseName=${encodeURIComponent(params.courseName)}&wordIds=${wordIds}&kind=${kind}`;
}
