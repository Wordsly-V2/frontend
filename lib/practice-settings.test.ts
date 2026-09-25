import { afterEach, describe, expect, it, vi } from "vitest";
import {
    buildMixedModePlan,
    DEFAULT_PRACTICE_SETTINGS,
    MIXED_PRACTICE_MODES,
    parsePracticeSettings,
    resolveActiveMode,
    SELECTABLE_MIXED_PRACTICE_MODES,
} from "@/lib/practice-settings";
import type { WordLearningStage } from "@/lib/word-progress-stage";
import type { IWord } from "@/types/courses/courses.type";

function word(id: string): IWord {
    return {
        id,
        word: `word-${id}`,
        meaning: "nghĩa",
        lessonId: "",
        createdAt: "",
        updatedAt: "",
    } as IWord;
}

const words = Array.from({ length: 12 }, (_, i) => word(String(i)));
const stages = (stage: WordLearningStage) =>
    Object.fromEntries(words.map((w) => [w.id, stage])) as Record<string, WordLearningStage>;

/** Pretend the browser can recognise speech. */
function withRecognition() {
    vi.stubGlobal("window", { SpeechRecognition: class {} });
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("speaking is opt-in", () => {
    it("is not in the default mix", () => {
        expect(DEFAULT_PRACTICE_SETTINGS.mixedModes).not.toContain("speaking");
        expect(MIXED_PRACTICE_MODES).not.toContain("speaking");
        expect(SELECTABLE_MIXED_PRACTICE_MODES).toContain("speaking");
    });

    it("keeps a stored choice to mix it in", () => {
        const settings = parsePracticeSettings(
            JSON.stringify({ mode: "mixed", mixedModes: ["word-bank", "speaking"] }),
            DEFAULT_PRACTICE_SETTINGS,
        );
        expect(settings.mixedModes).toEqual(["word-bank", "speaking"]);
    });

    it("is never planned unless chosen", () => {
        withRecognition();
        for (const enabledModes of [undefined, [], DEFAULT_PRACTICE_SETTINGS.mixedModes]) {
            const plan = buildMixedModePlan(words, stages("review"), { enabledModes });
            expect([...plan.values()]).not.toContain("speaking");
        }
    });

    it("is planned for reviews when chosen", () => {
        withRecognition();
        const plan = buildMixedModePlan(words, stages("review"), {
            enabledModes: ["word-bank", "speaking"],
        });
        expect([...plan.values()]).toContain("speaking");
    });

    it("is never planned for a new word", () => {
        withRecognition();
        const queue = [...words, ...words];
        const plan = buildMixedModePlan(queue, stages("new"), { enabledModes: ["word-bank", "speaking"] });
        expect([...plan.values()]).not.toContain("speaking");
    });

    it("is never planned when the browser can't recognise speech", () => {
        const plan = buildMixedModePlan(words, stages("review"), { enabledModes: ["speaking"] });
        expect([...plan.values()]).not.toContain("speaking");
    });

    it("falls back to a typed or picked exercise without recognition", () => {
        const availability = { cloze: true, listening: false, sentenceBuild: false, speaking: false };
        expect(resolveActiveMode("speaking", availability)).toBe("context");
        expect(resolveActiveMode("speaking", { ...availability, cloze: false })).toBe("word-bank");
        expect(resolveActiveMode("speaking", { ...availability, speaking: true })).toBe("speaking");
    });
});
