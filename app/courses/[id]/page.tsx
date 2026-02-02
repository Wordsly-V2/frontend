"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCourseById, createLessons, updateLessonOrder, createWords } from "@/apis/courses.api";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, Plus } from "lucide-react";
import Image from "next/image";
import LessonItem from "@/components/common/lesson-item/lesson-item";
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
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
    const [newLessons, setNewLessons] = useState<Array<{ tempId: string; name: string; coverImageUrl: string; maxWords: string }>>([
        { tempId: crypto.randomUUID(), name: "", coverImageUrl: "", maxWords: "" }
    ]);

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
            setNewLessons([{ tempId: crypto.randomUUID(), name: "", coverImageUrl: "", maxWords: "" }]);
        },
    });

    const createWordsMutation = useMutation({
        mutationFn: ({ lessonId, words }: { lessonId: string; words: Array<{ word: string; meaning: string; pronunciation?: string; partOfSpeech?: string; audioUrl?: string }> }) =>
            createWords(lessonId, { words }),
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

    const handleAddLessons = () => {
        const validLessons = newLessons
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

    const addLessonField = () => {
        setNewLessons([...newLessons, { tempId: crypto.randomUUID(), name: "", coverImageUrl: "", maxWords: "" }]);
    };

    const removeLessonField = (index: number) => {
        if (newLessons.length > 1) {
            setNewLessons(newLessons.filter((_, i) => i !== index));
        }
    };

    const updateLessonField = (index: number, field: keyof typeof newLessons[0], value: string) => {
        const updated = [...newLessons];
        updated[index] = { ...updated[index], [field]: value };
        setNewLessons(updated);
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

                    <div className="bg-card rounded-2xl shadow-sm overflow-hidden mb-8">
                        <div className="relative h-64 w-full">
                            {course.coverImageUrl && (
                                <Image
                                    src={course.coverImageUrl}
                                    alt={course.name}
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>
                        <div className="p-6">
                            <h1 className="text-3xl font-semibold mb-2">{course.name}</h1>
                            <p className="text-muted-foreground">
                                {localLessons.length} bài học
                            </p>
                        </div>
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
                            <Button onClick={() => setIsLessonDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Tạo bài học
                            </Button>
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
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </main>

            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tạo bài học mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {newLessons.map((lesson, index) => (
                            <div key={lesson.tempId} className="space-y-2 p-4 border border-border rounded-lg relative">
                                {newLessons.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                        onClick={() => removeLessonField(index)}
                                    >
                                        ×
                                    </Button>
                                )}
                                <div className="space-y-1.5">
                                    <label htmlFor={`lesson-name-${index}`} className="text-sm font-medium">
                                        Tên bài học {newLessons.length > 1 && `#${index + 1}`}
                                    </label>
                                    <Input
                                        id={`lesson-name-${index}`}
                                        placeholder="Nhập tên bài học"
                                        value={lesson.name}
                                        onChange={(e) => updateLessonField(index, 'name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor={`lesson-cover-${index}`} className="text-sm font-medium">Cover image URL (optional)</label>
                                    <Input
                                        id={`lesson-cover-${index}`}
                                        placeholder="https://..."
                                        value={lesson.coverImageUrl}
                                        onChange={(e) => updateLessonField(index, 'coverImageUrl', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor={`lesson-maxwords-${index}`} className="text-sm font-medium">Số từ tối đa (optional)</label>
                                    <Input
                                        id={`lesson-maxwords-${index}`}
                                        type="number"
                                        placeholder="Ví dụ: 50"
                                        value={lesson.maxWords}
                                        onChange={(e) => updateLessonField(index, 'maxWords', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" onClick={addLessonField} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm bài học
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLessonDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleAddLessons} disabled={createLessonsMutation.isPending}>
                            {createLessonsMutation.isPending ? "Đang tạo..." : `Tạo ${newLessons.filter(l => l.name.trim()).length} bài học`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
