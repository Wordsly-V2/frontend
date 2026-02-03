"use client";

import { IWord } from "@/types/courses/courses.type";
import VocabularyCard from "./vocabulary-card";

interface VocabularyListProps {
    words: IWord[];
    layout?: "grid" | "list";
    showMeaning?: boolean;
}

export default function VocabularyList({
    words,
    layout = "list",
    showMeaning = true,
}: Readonly<VocabularyListProps>) {
    if (words.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                    <svg
                        className="h-6 w-6 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                    </svg>
                </div>
                <h3 className="text-sm font-medium mb-1">No vocabulary yet</h3>
                <p className="text-sm text-muted-foreground">
                    Add words to start building your vocabulary.
                </p>
            </div>
        );
    }

    if (layout === "grid") {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {words.map((word) => (
                    <VocabularyCard
                        key={word.id}
                        word={word}
                        showMeaning={showMeaning}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {words.map((word) => (
                <VocabularyCard
                    key={word.id}
                    word={word}
                    showMeaning={showMeaning}
                    compact
                />
            ))}
        </div>
    );
}
