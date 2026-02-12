"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { IWord } from "@/types/courses/courses.type";
import { Volume2 } from "lucide-react";
import Image from "next/image";

function getWordExamples(word: IWord): string[] {
    try {
        const ex = JSON.parse(word.example ?? "[]");
        return Array.isArray(ex) ? ex.filter((e): e is string => typeof e === "string") : [];
    } catch {
        return [];
    }
}

interface WordDetailDialogProps {
    readonly word: IWord | null;
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

export default function WordDetailDialog({ word, isOpen, onClose }: WordDetailDialogProps) {
    if (!word) return null;

    const examples = getWordExamples(word);

    const handlePlayAudio = () => {
        if (word.audioUrl) {
            new Audio(word.audioUrl).play().catch(console.error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md flex max-h-[90vh] flex-col p-0">
                <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 flex-wrap">
                        <span>{word.word}</span>
                        {word.partOfSpeech && (
                            <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {word.partOfSpeech}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 space-y-4">
                    {word.imageUrl && (
                        <div className="relative w-full aspect-video max-h-48 rounded-lg overflow-hidden bg-muted">
                            <Image
                                src={word.imageUrl}
                                alt={word.word}
                                fill
                                className="object-contain"
                                sizes="(max-width: 640px) 100vw, 28rem"
                            />
                        </div>
                    )}
                    <p className="text-sm text-foreground">{word.meaning}</p>
                    {word.pronunciation && (
                        <p className="text-xs text-muted-foreground">{word.pronunciation}</p>
                    )}
                    {examples.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">Examples</p>
                            <ul className="space-y-1 text-sm">
                                {examples.map((ex, i) => (
                                    <li key={`${word.id}-ex-${i}`} className="break-words">• {ex}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {word.audioUrl && (
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={handlePlayAudio}>
                                <Volume2 className="h-4 w-4 mr-2" />
                                Play audio
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
