"use client";

import { ILesson } from "@/types/courses/courses.type";
import LessonCard from "./lesson-card";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface LessonListProps {
    lessons: ILesson[];
    onLessonClick?: (lessonId: string) => void;
    onReorder?: (lessons: ILesson[]) => void;
    sortable?: boolean;
}

export default function LessonList({
    lessons,
    onLessonClick,
    onReorder,
    sortable = false,
}: Readonly<LessonListProps>) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = lessons.findIndex((item) => item.id === active.id);
            const newIndex = lessons.findIndex((item) => item.id === over.id);
            const newLessons = arrayMove(lessons, oldIndex, newIndex);
            onReorder?.(newLessons);
        }
    };

    if (lessons.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                    <svg
                        className="h-6 w-6 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                    </svg>
                </div>
                <h3 className="text-sm font-medium mb-1">No lessons yet</h3>
                <p className="text-sm text-muted-foreground">
                    Create your first lesson to add vocabulary.
                </p>
            </div>
        );
    }

    const content = lessons.map((lesson, index) => (
        <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={index}
            sortable={sortable}
            onStart={onLessonClick ? () => onLessonClick(lesson.id) : undefined}
        />
    ));

    if (sortable && onReorder) {
        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={lessons.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-3">{content}</div>
                </SortableContext>
            </DndContext>
        );
    }

    return <div className="space-y-3">{content}</div>;
}
