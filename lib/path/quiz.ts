import type { PathQuestion } from "@/types/path/path.type";

/**
 * Loose comparison for typed answers: case, surrounding spaces, repeated
 * spaces, curly apostrophes and final punctuation don't count.
 */
export function normalizeAnswer(value: string): string {
    return value
        .replace(/[’‘]/g, "'")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[.!?,;:]+$/, "")
        .toLowerCase();
}

export function isGapCorrect(question: Extract<PathQuestion, { kind: "gap" }>, typed: string): boolean {
    const answer = normalizeAnswer(typed);
    return answer.length > 0 && question.answers.some((a) => normalizeAnswer(a) === answer);
}

/** The tiles of an order question: the answer's words, punctuation attached. */
export function orderTiles(answer: string): string[] {
    return answer.split(/\s+/).filter(Boolean);
}

export function isOrderCorrect(answer: string, picked: string[]): boolean {
    return normalizeAnswer(picked.join(" ")) === normalizeAnswer(answer);
}

/** Fisher–Yates, re-rolled (a few times) until the order differs from the input. */
export function shuffleTiles<T>(items: readonly T[], random: () => number = Math.random): T[] {
    if (items.length < 2) return [...items];
    for (let attempt = 0; attempt < 5; attempt++) {
        const out = [...items];
        for (let i = out.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [out[i], out[j]] = [out[j], out[i]];
        }
        if (out.some((item, i) => item !== items[i])) return out;
    }
    return [...items].reverse();
}

/** The correct answer as a learner should see it after a miss. */
export function correctAnswerText(question: PathQuestion): string {
    switch (question.kind) {
        case "choice":
            return question.options[question.answer];
        case "gap":
            return question.sentence.replace("___", question.answers[0]);
        case "order":
            return question.answer;
    }
}
