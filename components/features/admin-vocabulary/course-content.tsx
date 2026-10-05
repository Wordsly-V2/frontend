"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { countOf, GAP_BADGES, wordGaps, wordIpa } from "@/lib/admin/vocabulary";
import type { ILesson, IWord } from "@/types/courses/courses.type";
import { Pencil, Plus, Trash2 } from "lucide-react";

/**
 * A course's lessons and words as admins read and fix them: the learner
 * Vocabulary tab (A-9) and the official course editor (A-10).
 */

export const WORD_FILTERS = [
    { value: "all", label: "All words" },
    { value: "incomplete", label: "Missing something" },
] as const;
export type WordFilter = (typeof WORD_FILTERS)[number]["value"];

export function LessonSection({
    lesson,
    onlyIncomplete,
    onEdit,
    onDelete,
    onEditWord,
    onDeleteWord,
    onAddWord,
}: Readonly<{
    lesson: ILesson;
    onlyIncomplete: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onEditWord: (word: IWord) => void;
    onDeleteWord: (word: IWord) => void;
    /** Shown as "Add word" when given (official courses; a learner's own aren't added to). */
    onAddWord?: () => void;
}>) {
    const full = lesson.maxWords != null && (lesson.words?.length ?? 0) >= lesson.maxWords;
    const all = lesson.words ?? [];
    const shown = onlyIncomplete ? all.filter((word) => wordGaps(word).length > 0) : all;

    return (
        <section className="rounded-2xl border border-border/80 bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate font-semibold">{lesson.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {countOf(all.length, "word")}
                        {lesson.maxWords ? ` (max ${lesson.maxWords})` : ""}
                    </p>
                </div>
                <span className="flex flex-wrap gap-1">
                    {onAddWord ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onAddWord}
                            disabled={full}
                            title={full ? "This lesson is full" : undefined}
                            aria-label={`Add a word to ${lesson.name}`}
                        >
                            <Plus className="h-4 w-4" />
                            Add word
                        </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit lesson ${lesson.name}`}>
                        <Pencil className="h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete lesson ${lesson.name}`}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                </span>
            </div>
            {shown.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                    {all.length === 0 ? "No words in this lesson." : "Every word here is complete."}
                </p>
            ) : (
                <ul className="mt-3 divide-y divide-border/50">
                    {shown.map((word) => (
                        <WordRow key={word.id} word={word} onEdit={() => onEditWord(word)} onDelete={() => onDeleteWord(word)} />
                    ))}
                </ul>
            )}
        </section>
    );
}

export function WordRow({ word, onEdit, onDelete }: Readonly<{ word: IWord; onEdit: () => void; onDelete: () => void }>) {
    const gaps = wordGaps(word);
    const ipa = wordIpa(word);
    return (
        <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
                <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium">{word.word}</span>
                    {word.partOfSpeech ? <span className="text-xs text-muted-foreground">{word.partOfSpeech}</span> : null}
                    {ipa ? <span className="font-mono text-xs text-muted-foreground">{ipa}</span> : null}
                </p>
                <p className="text-sm text-muted-foreground">{word.meaning || "No meaning"}</p>
                {gaps.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                        {gaps.map((gap) => (
                            <Badge key={gap} variant="warning">
                                {GAP_BADGES[gap]}
                            </Badge>
                        ))}
                    </span>
                ) : null}
            </div>
            <span className="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${word.word}`}>
                    <Pencil className="h-4 w-4" />
                    Edit
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="text-destructive hover:text-destructive"
                    aria-label={`Delete ${word.word}`}
                >
                    <Trash2 className="h-4 w-4" />
                    Delete
                </Button>
            </span>
        </li>
    );
}
