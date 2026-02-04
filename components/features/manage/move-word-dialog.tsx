"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ILesson, IWord } from "@/types/courses/courses.type";
import { ArrowRight } from "lucide-react";

interface MoveWordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (targetLessonId: string) => void;
    word: IWord | null;
    currentLesson: ILesson | null;
    availableLessons: ILesson[];
}

export default function MoveWordDialog({
    isOpen,
    onClose,
    onConfirm,
    word,
    currentLesson,
    availableLessons,
}: Readonly<MoveWordDialogProps>) {
    const [selectedLessonId, setSelectedLessonId] = useState<string>("");

    const handleConfirm = () => {
        if (selectedLessonId) {
            onConfirm(selectedLessonId);
            setSelectedLessonId("");
        }
    };

    const handleClose = () => {
        setSelectedLessonId("");
        onClose();
    };

    if (!word || !currentLesson) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Move Word to Another Lesson</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Word Info */}
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{word.word}</span>
                            {word.partOfSpeech && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                    {word.partOfSpeech}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{word.meaning}</p>
                    </div>

                    {/* Current Lesson */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>From:</span>
                        <span className="font-medium text-foreground">{currentLesson.name}</span>
                    </div>

                    {/* Target Lesson Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="target-lesson">Move to:</Label>
                        <div className="space-y-2">
                            {availableLessons.map((lesson) => (
                                <button
                                    key={lesson.id}
                                    onClick={() => setSelectedLessonId(lesson.id)}
                                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                                        selectedLessonId === lesson.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50 bg-background"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium">{lesson.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {lesson.words?.length || 0} words
                                                {lesson.maxWords && ` • Max: ${lesson.maxWords}`}
                                            </div>
                                        </div>
                                        {selectedLessonId === lesson.id && (
                                            <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {availableLessons.length === 0 && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                            No other lessons available. Create another lesson first.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedLessonId}>
                        Move Word
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
