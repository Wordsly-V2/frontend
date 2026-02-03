"use client";

import { ILesson } from "@/types/courses/courses.type";
import { BookOpen, GripVertical, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

interface LessonCardProps {
    lesson: ILesson;
    onStart?: () => void;
    sortable?: boolean;
    index?: number;
}

export default function LessonCard({
    lesson,
    onStart,
    sortable = false,
    index = 0,
}: Readonly<LessonCardProps>) {
    const wordCount = lesson.words?.length || 0;
    const progress = 0; // TODO: Calculate actual progress

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: lesson.id,
        disabled: !sortable,
    });

    const style = sortable
        ? {
              transform: CSS.Transform.toString(transform),
              transition,
              opacity: isDragging ? 0.5 : 1,
          }
        : {};

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-4 p-4">
                {/* Drag Handle */}
                {sortable && (
                    <button
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </button>
                )}

                {/* Lesson Number */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                            {index + 1}
                        </span>
                    </div>
                </div>

                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base mb-1 line-clamp-1">{lesson.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>{wordCount} words</span>
                        </div>
                        {lesson.maxWords && (
                            <span className="text-xs">
                                Max: {lesson.maxWords}
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {progress > 0 && (
                        <div className="mt-2">
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Thumbnail (optional) */}
                {lesson.coverImageUrl && (
                    <div className="hidden sm:block flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                        <Image
                            src={lesson.coverImageUrl}
                            alt={lesson.name}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                        />
                    </div>
                )}

                {/* Start Button */}
                {onStart && (
                    <Button onClick={onStart} size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-1" />
                        Start
                    </Button>
                )}
            </div>
        </div>
    );
}
