import type { ActivePracticeMode } from "@/lib/practice-settings";
import type { LucideIcon } from "lucide-react";
import {
    CheckSquare,
    Headphones,
    Layers,
    ListChecks,
    TextCursorInput,
    TextQuote,
} from "lucide-react";

export interface PracticeModeMeta {
    label: string;
    shortLabel: string;
    instruction: string;
    icon: LucideIcon;
}

export const PRACTICE_MODE_META: Record<ActivePracticeMode, PracticeModeMeta> = {
    listening: {
        label: "Listening",
        shortLabel: "Listening",
        instruction: "Listen carefully, then type what you hear",
        icon: Headphones,
    },
    context: {
        label: "Type in context",
        shortLabel: "In context",
        instruction: "Complete the sentence by typing the missing word",
        icon: TextCursorInput,
    },
    "word-bank": {
        label: "Pick the word",
        shortLabel: "Word bank",
        instruction: "Read the meaning, then choose the correct word",
        icon: CheckSquare,
    },
    "multiple-choice": {
        label: "Pick the meaning",
        shortLabel: "Multiple choice",
        instruction: "Choose the correct meaning for this word",
        icon: ListChecks,
    },
    cloze: {
        label: "Fill the blank",
        shortLabel: "Cloze",
        instruction: "Complete the sentence with the right word",
        icon: TextQuote,
    },
    flashcard: {
        label: "Flashcard",
        shortLabel: "Flashcard",
        instruction: "Try to recall the meaning, then reveal and rate yourself",
        icon: Layers,
    },
};

export function getPracticeModeMeta(mode: ActivePracticeMode): PracticeModeMeta {
    return PRACTICE_MODE_META[mode];
}
