import { describe, expect, it } from "vitest";
import { courseWordCount, officialStatus, publishBlocker } from "@/lib/admin/official-courses";
import type { ILesson, IWord } from "@/types/courses/courses.type";

const lesson = (words: number): ILesson => ({
    id: `l${words}`,
    name: "Lesson",
    courseId: "c",
    createdAt: "",
    updatedAt: "",
    words: Array.from({ length: words }, (_, i) => ({ id: `w${i}` }) as IWord),
});

describe("official courses", () => {
    it("is a draft until it has a publish date", () => {
        expect(officialStatus({ publishedAt: null })).toBe("draft");
        expect(officialStatus({ publishedAt: "2026-10-05T00:00:00Z" })).toBe("published");
    });

    it("counts words across lessons", () => {
        expect(courseWordCount({ lessons: [lesson(2), lesson(0), lesson(3)] })).toBe(5);
    });

    it("can be published once it has a word, like the server", () => {
        expect(publishBlocker({ lessons: [] })).toMatch(/lesson/);
        expect(publishBlocker({ lessons: [lesson(0)] })).toMatch(/word/);
        expect(publishBlocker({ lessons: [lesson(0), lesson(1)] })).toBeNull();
    });
});
