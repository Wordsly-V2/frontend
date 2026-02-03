"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
    getCourseById,
    createLessons,
    updateLessonOrder,
    createWords,
    deleteCourse,
    deleteLesson,
    deleteWord,
} from "@/apis/courses.api";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, Plus } from "lucide-react";
import LessonItem from "@/components/common/lesson-item/lesson-item";
import EntityHeader from "@/components/common/entity-header/entity-header";
import CreationLessonDialog, { LessonFormData } from "@/components/common/creation-lesson-dialog/creation-lesson-dialog";
import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
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
import { ILesson } from "@/types/courses/courses.type";

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;

    const { data: course, isLoading, error, refetch } = useQuery({
        queryKey: ['course', courseId],
        queryFn: () => getCourseById(courseId),
    });

    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Compute sorted lessons from course data
    const sortedLessons = useMemo(() => {
        if (!course?.lessons) return [];
        return [...course.lessons].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }, [course?.lessons]);

    // Track local lesson state for drag and drop
    const [localLessons, setLocalLessons] = useState<ILesson[]>([]);

    // Update local lessons when course data changes
    useEffect(() => {
        setLocalLessons(sortedLessons);
    }, [sortedLessons]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const updateOrderMutation = useMutation({
        mutationFn: ({ lessonId, orderIndex }: { lessonId: string; orderIndex: number }) =>
            updateLessonOrder(courseId, lessonId, orderIndex),
    });

    const createLessonsMutation = useMutation({
        mutationFn: (payload: { lessons: Array<{ name: string; coverImageUrl?: string; maxWords?: number }> }) =>
            createLessons(courseId, payload),
        onSuccess: () => {
            refetch();
            setIsLessonDialogOpen(false);
        },
    });

    const createWordsMutation = useMutation({
        mutationFn: ({ lessonId, words }: { lessonId: string; words: Array<{ word: string; meaning: string; pronunciation?: string; partOfSpeech?: string; audioUrl?: string }> }) =>
            createWords(lessonId, { words }),
        onSuccess: () => {
            refetch();
        },
    });

    const deleteCourseMutation = useMutation({
        mutationFn: () => deleteCourse(courseId),
        onSuccess: () => {
            router.push('/courses');
        },
    });

    const deleteLessonMutation = useMutation({
        mutationFn: (lessonId: string) => deleteLesson(courseId, lessonId),
        onSuccess: () => {
            refetch();
        },
    });

    const deleteWordMutation = useMutation({
        mutationFn: ({ lessonId, wordId }: { lessonId: string; wordId: string }) =>
            deleteWord(lessonId, wordId),
        onSuccess: () => {
            refetch();
        },
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLocalLessons((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update order index for the moved lesson
                updateOrderMutation.mutate({
                    lessonId: active.id as string,
                    orderIndex: newIndex,
                });

                return newItems;
            });
        }
    };

    const handleAddLessons = (lessons: LessonFormData[]) => {
        const validLessons = lessons
            .filter(l => l.name.trim())
            .map(l => ({
                name: l.name,
                coverImageUrl: l.coverImageUrl || undefined,
                maxWords: l.maxWords ? Number.parseInt(l.maxWords) : undefined,
            }));

        if (validLessons.length > 0) {
            createLessonsMutation.mutate({ lessons: validLessons });
        }
    };

    const handleDeleteCourse = () => {
        deleteCourseMutation.mutate();
    };

    const handleDeleteLesson = (lessonId: string) => {
        deleteLessonMutation.mutate(lessonId);
    };

    const handleDeleteWord = (lessonId: string, wordId: string) => {
        deleteWordMutation.mutate({ lessonId, wordId });
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <LoadingSpinner size="lg" label="Đang tải khóa học…" />
            </main>
        );
    }

    if (error || !course) {
        return (
            <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 gap-4">
                <div>Error: {error?.message || "Không tìm thấy khóa học"}</div>
                <Button onClick={() => router.push('/courses')}>Quay lại</Button>
            </main>
        );
    }

    return (
        <>
            <main className="min-h-screen bg-slate-50">
                <div className="container mx-auto px-4 py-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/courses')}
                        className="mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>

                    <div className="mb-8">
                        <EntityHeader
                            title={course.name}
                            subtitle={`${localLessons.length} bài học`}
                            coverImageUrl={course.coverImageUrl}
                            onDelete={() => setDeleteConfirmOpen(true)}
                        />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold">Bài học</h2>
                        <Button onClick={() => setIsLessonDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo bài học
                        </Button>
                    </div>

                    {localLessons.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-lg border border-border">
                            <p className="text-muted-foreground mb-4">
                                Chưa có bài học nào. Tạo bài học đầu tiên để bắt đầu.
                            </p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={localLessons.map(l => l.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4">
                                    {localLessons.map((lesson) => (
                                        <LessonItem
                                            key={lesson.id}
                                            lesson={lesson}
                                            onAddWords={(lessonId, words) => {
                                                createWordsMutation.mutate({ lessonId, words });
                                            }}
                                            onDeleteLesson={handleDeleteLesson}
                                            onDeleteWord={handleDeleteWord}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </main>

            <CreationLessonDialog
                isOpen={isLessonDialogOpen}
                onSubmit={handleAddLessons}
                onClose={() => setIsLessonDialogOpen(false)}
                isSubmitting={createLessonsMutation.isPending}
            />

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleDeleteCourse}
                title="Xóa khóa học"
                description={`Bạn có chắc chắn muốn xóa khóa học &ldquo;${course.name}&rdquo;? Tất cả bài học và từ vựng trong khóa học này cũng sẽ bị xóa. Hành động này không thể hoàn tác.`}
                confirmText="Xóa khóa học"
                variant="destructive"
                isLoading={deleteCourseMutation.isPending}
            />
        </>
    );
}
