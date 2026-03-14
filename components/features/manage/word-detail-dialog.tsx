"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getPlayPhraseSearchUrl } from "@/lib/playphrase";
import { WordDetailView } from "@/types/courses/courses.type";
import { BookOpen, ExternalLink, Film, Volume2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

function getWordExamples(word: WordDetailView): string[] {
    try {
        const ex = JSON.parse(word.example ?? "[]");
        return Array.isArray(ex) ? ex.filter((e): e is string => typeof e === "string") : [];
    } catch {
        return [];
    }
}

interface WordDetailDialogProps {
    readonly word: WordDetailView;
    readonly isOpen: boolean;
    readonly onClose: () => void;
    /** When set, show "Open in Manage" / "Open in Learn" (e.g. when opened from search). */
    readonly courseId?: string;
    readonly lessonId?: string;
    /** Show loading spinner inside dialog when word is not yet available. */
    readonly isLoading?: boolean;
    /** True when fetch finished but no word (e.g. 404). Show "details not available" and close. */
    readonly isNotFound?: boolean;
}

export default function WordDetailDialog({ word, isOpen, onClose, courseId, lessonId, isLoading, isNotFound }: WordDetailDialogProps) {
    const router = useRouter();
    const canNavigate = !!(courseId && lessonId);

    if (!isOpen) return null;
    if (!word && !isLoading && !isNotFound) return null;

    const examples = getWordExamples(word);

    const handlePlayAudio = () => {
        if (word!.audioUrl) {
            new Audio(word!.audioUrl).play().catch(console.error);
        }
    };

    const handleGoToManage = () => {
        onClose();
        const params = new URLSearchParams({ word: word.word, lessonId: lessonId! });
        router.push(`/manage/courses/${courseId}?${params.toString()}`);
    };

    const handleGoToLearn = () => {
        onClose();
        const params = new URLSearchParams({ word: word.word, lessonId: lessonId! });
        router.push(`/learn/courses/${courseId}?${params.toString()}`);
    };

    if (isLoading && !word) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-md flex max-h-[90dvh] flex-col p-0">
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="md" label="Loading word details..." />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (isNotFound && !word) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-md flex max-h-[90dvh] flex-col p-0">
                    <div className="px-6 py-8 text-center text-muted-foreground">
                        <p className="text-sm">Details for this word are not available.</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md flex max-h-[90dvh] flex-col p-0">
                <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 flex-wrap">
                        <span>{word!.word}</span>
                        {word!.partOfSpeech && (
                            <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {word!.partOfSpeech}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 space-y-4">
                    {word!.imageUrl && (
                        <div className="relative w-full aspect-video max-h-48 rounded-lg overflow-hidden bg-muted">
                            <Image
                                src={word!.imageUrl}
                                alt={word!.word}
                                fill
                                className="object-contain"
                                sizes="(max-width: 640px) 100vw, 28rem"
                            />
                        </div>
                    )}
                    <p className="text-sm text-foreground">{word!.meaning}</p>
                    {word!.pronunciation && (
                        <p className="text-xs text-muted-foreground">{word!.pronunciation}</p>
                    )}
                    {examples.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5">Examples</p>
                            <ul className="space-y-1 text-sm">
                                {examples.map((ex, i) => (
                                    <li key={`${word!.id ?? "w"}-ex-${i}`} className="break-words">• {ex}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href={getPlayPhraseSearchUrl(word!.word)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gap-2"
                            >
                                <Film className="h-4 w-4" />
                                Watch movie clips
                            </a>
                        </Button>
                        {word!.audioUrl && (
                            <Button variant="outline" size="sm" onClick={handlePlayAudio}>
                                <Volume2 className="h-4 w-4 mr-2" />
                                Play audio
                            </Button>
                        )}
                    </div>
                    {canNavigate && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                            <Button variant="default" size="sm" onClick={handleGoToManage} className="gap-2">
                                <ExternalLink className="h-4 w-4" />
                                Open in Manage
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleGoToLearn} className="gap-2">
                                <BookOpen className="h-4 w-4" />
                                Open in Learn
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
