import { buildInterleavedNewWordRepetitions, type WordLearningStage } from "@/lib/word-progress-stage";
import { buildPathClozePrompts } from "@/lib/path/item-context";
import { shuffleArray, type ClozePrompt } from "@/lib/practice-utils";
import type { IWord } from "@/types/courses/courses.type";
import type {
    PathDialogue,
    PathItem,
    PathItemRole,
    PathItemType,
} from "@/types/path/path.type";

/**
 * Wordsly Path items in the vocabulary practice engine.
 *
 * The engine was built for the learner's own words (`IWord`); an item maps onto
 * one closely enough for every mode to work. Its id stays the item id, so the
 * answers land on the item's FSRS card (sent with `source: 'path'`).
 */

const PART_OF_SPEECH: Record<PathItemType, string> = {
    LEXICAL: "word",
    PHRASE: "phrase",
    PATTERN: "pattern",
    GRAMMAR: "grammar",
};

export function itemToWord(item: PathItem): IWord {
    return {
        id: item.id,
        word: item.text,
        meaning: item.meaningVi,
        pronunciation: item.ipa,
        partOfSpeech: PART_OF_SPEECH[item.type],
        audioUrl: item.audioUrl,
        // The engine reads examples as JSON `{ text, translation }[]`.
        example: JSON.stringify(item.examples.map((e) => ({ text: e.en, translation: e.vi }))),
        lessonId: "",
        createdAt: "",
        updatedAt: "",
    };
}

/**
 * Items the engine can drill. Patterns and grammar points have their own steps
 * (PATTERN_DRILL, EXPLAIN); typed as a "word" they would make exercises no one
 * could answer ("am / is / are").
 */
export function isPracticeable(item: PathItem): boolean {
    return item.type === "LEXICAL" || item.type === "PHRASE";
}

/**
 * Rounds per new item inside a lesson. Lower than the engine's standalone
 * default: the lesson has already introduced the item and will quiz it.
 */
export const PATH_NEW_ITEM_REPETITIONS = 2;

export interface PathPracticePlan {
    words: IWord[];
    queue: IWord[];
    stagesByWordId: Record<string, WordLearningStage>;
    /** Items the lesson introduced: no Learn card before their first exercise. */
    introSeenWordIds: Set<string>;
    /** Fill-in prompts with context, per item (see `buildPathClozePrompts`). */
    clozePromptsByWordId: Record<string, ClozePrompt[]>;
}

/**
 * The practice queue for a lesson step: recycled items first (one round each,
 * as reviews), then the lesson's new items, interleaved over a few rounds.
 * `dialogues` are the lesson's own, for fill-ins set in a dialogue turn.
 */
export function buildPathPracticePlan(
    items: (PathItem & { role?: PathItemRole })[],
    dialogues: PathDialogue[] = [],
): PathPracticePlan {
    const practiceable = items.filter(isPracticeable);
    const words = practiceable.map(itemToWord);
    const stagesByWordId: Record<string, WordLearningStage> = {};
    const fresh: IWord[] = [];
    const recycled: IWord[] = [];
    const clozePromptsByWordId: Record<string, ClozePrompt[]> = {};

    practiceable.forEach((item, i) => {
        const isNew = item.role === "INTRODUCE";
        stagesByWordId[item.id] = isNew ? "new" : "review";
        (isNew ? fresh : recycled).push(words[i]);
        clozePromptsByWordId[item.id] = buildPathClozePrompts(item, dialogues);
    });

    return {
        words,
        queue: [
            ...shuffleArray(recycled),
            ...buildInterleavedNewWordRepetitions(fresh, PATH_NEW_ITEM_REPETITIONS),
        ],
        stagesByWordId,
        introSeenWordIds: new Set(fresh.map((w) => w.id)),
        clozePromptsByWordId,
    };
}
