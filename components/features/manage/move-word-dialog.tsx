"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ILesson, IWord } from "@/types/courses/courses.type";
import { ArrowRight } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MoveWordDialogProps {
    isLoading?: boolean;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (targetLessonId: string) => void;
    words: IWord[];
    currentLesson: ILesson | null;
    availableLessons: ILesson[];
}

export default function MoveWordDialog({
    isLoading,
    isOpen,
    onClose,
    onConfirm,
    words,
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

    if (words.length === 0 || !currentLesson) return null;

    const isBulk = words.length > 1;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto sm:mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                        {isBulk ? `Move ${words.length} Words to Another Lesson` : 'Move Word to Another Lesson'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                    {/* Word Info */}
                    {isBulk ? (
                        <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs sm:text-sm font-medium mb-2">Selected words ({words.length}):</p>
                            <div className="space-y-1 max-h-[100px] sm:max-h-[120px] overflow-y-auto">
                                {words.map((word) => (
                                    <div key={word.id} className="flex items-center gap-2 text-xs sm:text-sm">
                                        <span className="font-medium truncate">{word.word}</span>
                                        {word.partOfSpeech && (
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">
                                                {word.partOfSpeech}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-2.5 sm:p-3 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-semibold text-sm sm:text-base">{words[0].word}</span>
                                {words[0].partOfSpeech && (
                                    <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                        {words[0].partOfSpeech}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground break-words">{words[0].meaning}</p>
                        </div>
                    )}

                    {/* Current Lesson */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <span>From:</span>
                        <span className="font-medium text-foreground truncate">{currentLesson.name}</span>
                    </div>

                    {/* Target Lesson Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="target-lesson" className="text-sm">Move to:</Label>
                        <div className="space-y-2 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-1">
                            {availableLessons.map((lesson) => (
                                <button
                                    key={lesson.id}
                                    onClick={() => setSelectedLessonId(lesson.id)}
                                    className={`w-full p-2.5 sm:p-3 text-left rounded-lg border-2 transition-all ${
                                        selectedLessonId === lesson.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50 bg-background"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm sm:text-base truncate">{lesson.name}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                                {lesson.words?.length || 0} words
                                                {lesson.maxWords && ` • Max: ${lesson.maxWords}`}
                                            </div>
                                        </div>
                                        {selectedLessonId === lesson.id && (
                                            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {availableLessons.length === 0 && (
                        <div className="text-center py-3 sm:py-4 text-xs sm:text-sm text-muted-foreground">
                            No other lessons available. Create another lesson first.
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading} className="w-full sm:w-auto text-sm">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedLessonId || isLoading} className="w-full sm:w-auto text-sm">
                        {isLoading ? (
                            <LoadingSpinner size="sm" />
                        ) : isBulk ? (
                            `Move ${words.length} Words`
                        ) : (
                            'Move Word'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
