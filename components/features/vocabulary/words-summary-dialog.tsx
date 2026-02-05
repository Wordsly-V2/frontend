"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IWord } from "@/types/courses/courses.type";
import { Volume2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WordsSummaryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    words: IWord[];
    currentIndex: number;
}

export default function WordsSummaryDialog({
    isOpen,
    onClose,
    words,
    currentIndex,
}: Readonly<WordsSummaryDialogProps>) {
    const handlePlayAudio = (audioUrl: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play().catch(console.error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Words Summary</DialogTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {words.length} words • Currently at word {currentIndex + 1}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className="space-y-3 py-4">
                        {words.map((word, index) => (
                            <div
                                key={word.id}
                                className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                                    index === currentIndex
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-background hover:border-primary/50"
                                }`}
                            >
                                {/* Number Badge */}
                                <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                        index === currentIndex
                                            ? "bg-primary text-primary-foreground"
                                            : index < currentIndex
                                            ? "bg-muted text-muted-foreground"
                                            : "bg-muted/50 text-muted-foreground/70"
                                    }`}
                                >
                                    {index + 1}
                                </div>

                                {/* Word Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-semibold text-lg">{word.word}</span>
                                        {word.partOfSpeech && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                                {word.partOfSpeech}
                                            </span>
                                        )}
                                        {index === currentIndex && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">
                                                Current
                                            </span>
                                        )}
                                        {index < currentIndex && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium">
                                                Completed
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-foreground mb-1">{word.meaning}</p>
                                    {word.pronunciation && (
                                        <p className="text-xs text-muted-foreground">
                                            {word.pronunciation}
                                        </p>
                                    )}
                                </div>

                                {/* Audio Button */}
                                {word.audioUrl && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => handlePlayAudio(word.audioUrl, e)}
                                        className="flex-shrink-0 text-primary hover:text-primary"
                                    >
                                        <Volume2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
                    <p className="text-sm text-muted-foreground">
                        Scroll to see all words
                    </p>
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
