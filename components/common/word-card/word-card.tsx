"use client";

import { IWord } from "@/types/courses/courses.type";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Volume2 } from "lucide-react";

interface WordCardProps {
    word: IWord;
    onDelete?: (wordId: string) => void;
    onEdit?: (word: IWord) => void;
    onPlayAudio?: (audioUrl: string) => void;
    showActions?: boolean;
}

export default function WordCard({
    word,
    onDelete,
    onEdit,
    onPlayAudio,
    showActions = true,
}: Readonly<WordCardProps>) {
    const handlePlayAudio = () => {
        if (word.audioUrl && onPlayAudio) {
            onPlayAudio(word.audioUrl);
        } else if (word.audioUrl) {
            // Default audio playback
            const audio = new Audio(word.audioUrl);
            audio.play();
        }
    };

    return (
        <div className="p-3 border border-border rounded-lg bg-background hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-lg">{word.word}</h4>
                        {word.partOfSpeech && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                {word.partOfSpeech}
                            </span>
                        )}
                    </div>
                    {word.pronunciation && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                            /{word.pronunciation}/
                        </p>
                    )}
                    <p className="text-sm mt-2 text-foreground">{word.meaning}</p>
                </div>
                <div className="flex items-center gap-1">
                    {word.audioUrl && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handlePlayAudio}
                            title="Phát âm thanh"
                            className="h-8 w-8"
                        >
                            <Volume2 className="h-4 w-4" />
                        </Button>
                    )}
                    {showActions && (
                        <>
                            {onEdit && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(word)}
                                    title="Chỉnh sửa"
                                    className="h-8 w-8"
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(word.id)}
                                    title="Xóa"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
