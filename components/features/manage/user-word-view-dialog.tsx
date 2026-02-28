"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { IUserWordSearchResult } from "@/types/courses/courses.type";
import { BookOpen, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface UserWordViewDialogProps {
    readonly word: IUserWordSearchResult | null;
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

export default function UserWordViewDialog({ word, isOpen, onClose }: Readonly<UserWordViewDialogProps>) {
    const router = useRouter();

    if (!word) return null;

    const handleGoToCourse = () => {
        onClose();
        const params = new URLSearchParams({ word: word.word, lessonId: word.lessonId });
        router.push(`/manage/courses/${word.courseId}?${params.toString()}`);
    };

    const handleGoToLearn = () => {
        onClose();
        const params = new URLSearchParams({ word: word.word, lessonId: word.lessonId });
        router.push(`/learn/courses/${word.courseId}?${params.toString()}`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md flex max-h-[90dvh] flex-col p-0">
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
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Course:</span> {word.courseName}
                        </p>
                        <p className="text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">Lesson:</span> {word.lessonName}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="default" size="sm" onClick={handleGoToCourse} className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Open in Manage
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleGoToLearn} className="gap-2">
                            <BookOpen className="h-4 w-4" />
                            Open in Learn
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
