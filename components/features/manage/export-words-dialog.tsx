"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ILesson, IWord } from "@/types/courses/courses.type";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const EXPORTABLE_WORD_FIELDS: { key: keyof Omit<IWord, "lessonId">; label: string }[] = [
    { key: "word", label: "Word" },
    { key: "meaning", label: "Meaning" },
    { key: "pronunciation", label: "Pronunciation" },
    { key: "partOfSpeech", label: "Part of speech" },
    { key: "audioUrl", label: "Audio URL" },
    { key: "imageUrl", label: "Image URL" },
    { key: "example", label: "Example" },
    { key: "id", label: "ID" },
];

const DEFAULT_FIELDS: (keyof Omit<IWord, "lessonId">)[] = ["word", "meaning", "pronunciation", "partOfSpeech", "imageUrl", "example", "audioUrl"];

interface WordWithLesson {
    word: IWord;
    lessonName: string;
}

interface ExportWordsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    lessons: ILesson[];
    courseName: string;
}

export default function ExportWordsDialog({
    isOpen,
    onClose,
    lessons,
    courseName,
}: Readonly<ExportWordsDialogProps>) {
    const wordsWithLesson: WordWithLesson[] = useMemo(() => {
        const list: WordWithLesson[] = [];
        lessons.forEach((lesson) => {
            (lesson.words || []).forEach((w) => list.push({ word: w, lessonName: lesson.name }));
        });
        return list;
    }, [lessons]);

    const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(() => new Set());
    const [selectedFields, setSelectedFields] = useState<Set<keyof IWord>>(() => new Set(DEFAULT_FIELDS));

    const allWordIds = useMemo(() => new Set(wordsWithLesson.map(({ word }) => word.id)), [wordsWithLesson]);
    const allSelected = allWordIds.size > 0 && selectedWordIds.size === allWordIds.size;

    const toggleWord = (wordId: string) => {
        setSelectedWordIds((prev) => {
            const next = new Set(prev);
            if (next.has(wordId)) next.delete(wordId);
            else next.add(wordId);
            return next;
        });
    };

    const toggleSelectAllWords = (checked: boolean) => {
        setSelectedWordIds(checked ? new Set(allWordIds) : new Set());
    };

    const toggleField = (key: keyof IWord) => {
        setSelectedFields((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const handleExport = () => {
        if (selectedWordIds.size === 0) {
            toast.error("Select at least one word");
            return;
        }
        if (selectedFields.size === 0) {
            toast.error("Select at least one field to export");
            return;
        }
        const selected = wordsWithLesson
            .filter(({ word }) => selectedWordIds.has(word.id))
            .map(({ word }) => {
                const entry: Record<string, unknown> = {};
                selectedFields.forEach((key) => {
                    const value = word[key];
                    if (value !== undefined && value !== null && key !== "wordProgress") {
                        entry[key] = value;
                    }
                });
                return entry;
            });
        const blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${courseName.replaceAll(/[^a-z0-9]/gi, "-").toLowerCase()}-words.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Words exported to JSON");
        onClose();
    };

    const handleClose = () => {
        setSelectedWordIds(new Set());
        setSelectedFields(new Set(DEFAULT_FIELDS));
        onClose();
    };

    if (wordsWithLesson.length === 0) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="max-w-md sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">Export words</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground py-4">No words in this course to export.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col sm:mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Export words to JSON</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-2">
                    {/* Field selection */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Fields to export</p>
                        <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                            {EXPORTABLE_WORD_FIELDS.map(({ key, label }) => (
                                <label
                                    key={key}
                                    className="flex items-center gap-2 text-sm cursor-pointer"
                                >
                                    <Checkbox
                                        checked={selectedFields.has(key)}
                                        onCheckedChange={() => toggleField(key)}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Word selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Select words</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-8"
                                onClick={() => toggleSelectAllWords(!allSelected)}
                            >
                                {allSelected ? "Deselect all" : "Select all"}
                            </Button>
                        </div>
                        <div className="border border-border rounded-lg max-h-[240px] overflow-y-auto">
                            {wordsWithLesson.map(({ word, lessonName }) => (
                                <label
                                    key={word.id}
                                    className="flex items-center gap-3 px-3 py-2 border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer"
                                >
                                    <Checkbox
                                        checked={selectedWordIds.has(word.id)}
                                        onCheckedChange={() => toggleWord(word.id)}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <span className="font-medium text-sm truncate block">{word.word}</span>
                                        <span className="text-xs text-muted-foreground truncate block">{lessonName}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {selectedWordIds.size} of {wordsWithLesson.length} words selected
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 border-t pt-4">
                    <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto text-sm">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={selectedWordIds.size === 0 || selectedFields.size === 0}
                        className="w-full sm:w-auto text-sm"
                    >
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                        Export JSON
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
