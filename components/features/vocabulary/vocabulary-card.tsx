"use client";

import { IWord } from "@/types/courses/courses.type";
import { Volume2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface VocabularyCardProps {
    word: IWord;
    onPlayAudio?: () => void;
    showMeaning?: boolean;
    compact?: boolean;
}

export default function VocabularyCard({
    word,
    onPlayAudio,
    showMeaning = true,
    compact = false,
}: Readonly<VocabularyCardProps>) {
    const [isFlipped, setIsFlipped] = useState(showMeaning);

    const handlePlayAudio = () => {
        if (onPlayAudio) {
            onPlayAudio();
        } else if (word.audioUrl) {
            const audio = new Audio(word.audioUrl);
            audio.play().catch(console.error);
        }
    };

    if (compact) {
        return (
            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{word.word}</span>
                        {word.partOfSpeech && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {word.partOfSpeech}
                            </span>
                        )}
                    </div>
                    {word.pronunciation && (
                        <p className="text-sm text-muted-foreground">/{word.pronunciation}/</p>
                    )}
                    {isFlipped && (
                        <p className="text-sm mt-1 text-foreground">{word.meaning}</p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {word.audioUrl && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handlePlayAudio}
                        >
                            <Volume2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className="bg-card border-2 border-border rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer group"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className="space-y-4">
                {/* Word & Type */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold">{word.word}</h3>
                            {word.partOfSpeech && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                                    {word.partOfSpeech}
                                </span>
                            )}
                        </div>
                        {word.pronunciation && (
                            <p className="text-muted-foreground">/{word.pronunciation}/</p>
                        )}
                    </div>
                    <div className="flex gap-1">
                        {word.audioUrl && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayAudio();
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Volume2 className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Meaning */}
                <div
                    className={`transition-all duration-300 ${
                        isFlipped ? 'opacity-100 max-h-32' : 'opacity-0 max-h-0 overflow-hidden'
                    }`}
                >
                    <div className="pt-4 border-t border-border">
                        <p className="text-lg">{word.meaning}</p>
                    </div>
                </div>

                {/* Tap to reveal hint */}
                {!isFlipped && (
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                            Tap to see meaning
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
