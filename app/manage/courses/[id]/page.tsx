"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import LoadingSection from "@/components/common/loading-section/loading-section";
import CourseFormDialog from "@/components/features/manage/course-form-dialog";
import LessonFormDialog from "@/components/features/manage/lesson-form-dialog";
import MoveWordDialog from "@/components/features/manage/move-word-dialog";
import WordFormDialog from "@/components/features/manage/word-form-dialog";
import { useCourses } from "@/hooks/useCourses.hook";
import { useLessons } from "@/hooks/useLessons.hook";
import { useWords } from "@/hooks/useWords.hook";
import {
    deleteWord,
    moveWord,
    reorderLessons,
    updateCourse,
    updateWord
} from "@/lib/data-store";
import { useGetCourseDetailByIdQuery } from "@/queries/courses.query";
import { CreateMyLesson, CreateMyWord, ICourse, ILesson, IWord } from "@/types/courses/courses.type";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowRightLeft, ChevronDown, ChevronRight, Edit, GripVertical, Plus, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";

function SortableLesson({
    lesson,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onAddWord,
    onEditWord,
    onDeleteWord,
    onMoveWord,
}: {
    lesson: ILesson;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddWord: () => void;
    onEditWord: (word: IWord) => void;
    onDeleteWord: (word: IWord) => void;
    onMoveWord: (word: IWord) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: lesson.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const words = lesson.words || [];

    return (
        <div ref={setNodeRef} style={style} className="bg-card border-2 border-border rounded-2xl overflow-hidden">
            {/* Lesson Header */}
            <div className="p-4 bg-muted/30 flex items-center gap-3">
                <button className="cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </button>
                <button
                    onClick={onToggle}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                    ) : (
                        <ChevronRight className="h-5 w-5" />
                    )}
                </button>
                {lesson.coverImageUrl && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                            src={lesson.coverImageUrl}
                            alt={lesson.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                            }}
                        />
                    </div>
                )}
                <div className="flex-1">
                    <h3 className="font-semibold text-lg">{lesson.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {words.length} words {lesson.maxWords && `• Max: ${lesson.maxWords}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={onAddWord}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Word
                    </Button>
                    <Button size="sm" variant="outline" onClick={onEdit}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Words List */}
            {isExpanded && words.length > 0 && (
                <div className="p-4 space-y-2">
                    {words.map((word) => (
                        <div key={word.id} className="flex items-start gap-3 p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-semibold text-base">{word.word}</span>
                                    {word.partOfSpeech && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                            {word.partOfSpeech}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-foreground mb-1">{word.meaning}</p>
                                {word.pronunciation && (
                                    <p className="text-xs text-muted-foreground">
                                        /{word.pronunciation}/
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                                {word.audioUrl && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const audio = new Audio(word.audioUrl);
                                            audio.play().catch(console.error);
                                        }}
                                        className="text-primary hover:text-primary"
                                    >
                                        <Volume2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onMoveWord(word)}
                                    title="Move to another lesson"
                                >
                                    <ArrowRightLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => onEditWord(word)}>
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onDeleteWord(word)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isExpanded && words.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">No words yet. Click &ldquo;Add Word&rdquo; to get started.</p>
                </div>
            )}
        </div>
    );
}

export default function ManageCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [lessons, setLessons] = useState<ILesson[]>([]);
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

    // Dialog states
    const [courseFormOpen, setCourseFormOpen] = useState(false);
    const [deleteCourseConfirm, setDeleteCourseConfirm] = useState(false);
    const [lessonFormOpen, setLessonFormOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<ILesson | undefined>();
    const [wordFormOpen, setWordFormOpen] = useState(false);
    const [editingWord, setEditingWord] = useState<IWord | undefined>();
    const [activeLesson, setActiveLesson] = useState<ILesson | undefined>();
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'lesson' | 'word'; item: ILesson | IWord } | null>(null);
    const [moveWordDialog, setMoveWordDialog] = useState<{ word: IWord; sourceLesson: ILesson } | null>(null);

    const { data: course, isLoading, isError, refetch: loadCourseDetail } = useGetCourseDetailByIdQuery(id);
    const { mutationUpdateMyCourse, mutationDeleteMyCourse } = useCourses();
    const { mutationCreateMyCourseLesson, mutationUpdateMyCourseLesson, mutationDeleteMyCourseLesson } = useLessons();
    const { mutationCreateMyWord, mutationUpdateMyWord, mutationDeleteMyWord } = useWords();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const loadCourse = useCallback(() => {
        loadCourseDetail().then(({ data: course }) => {
            if (course) {
                setLessons(course.lessons || []);
            }
        });
    }, [loadCourseDetail]);

    useEffect(() => {
        loadCourse();
    }, [loadCourse]);

    const toggleLesson = (lessonId: string) => {
        const newExpanded = new Set(expandedLessons);
        if (newExpanded.has(lessonId)) {
            newExpanded.delete(lessonId);
        } else {
            newExpanded.add(lessonId);
        }
        setExpandedLessons(newExpanded);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = lessons.findIndex((l) => l.id === active.id);
            const newIndex = lessons.findIndex((l) => l.id === over.id);
            const newLessons = arrayMove(lessons, oldIndex, newIndex);
            setLessons(newLessons);
            reorderLessons(id, newLessons.map((l) => l.id));
        }
    };

    const handleUpdateMyCourse = (courseId: string, courseData: Pick<ICourse, 'name' | 'coverImageUrl'>) => {
        mutationUpdateMyCourse.mutate({ courseId, courseData }, {
            onSuccess: () => {
                updateCourse(id, courseData);
                loadCourse();
                setCourseFormOpen(false);
                toast.success('Course updated successfully');
            },
            onError: (err) => {
                toast.error('Failed to update course: ' + err.message);
            },
        });
    }

    const handleDeleteMyCourse = (courseId: string) => {
        return mutationDeleteMyCourse.mutate(courseId, {
            onSuccess: () => {
                loadCourse();
                setDeleteCourseConfirm(false);
                router.push('/manage/courses');
                toast.success('Course deleted successfully');
            },
            onError: (err) => {
                toast.error('Failed to delete course: ' + err.message);
            },
        });
    }

    const handleCreateMyCourseLesson = (lessonData: CreateMyLesson) => {
        mutationCreateMyCourseLesson.mutate({ courseId: id, lesson: lessonData }, {
            onSuccess: () => {
                loadCourse();
                setLessonFormOpen(false);
            },
            onError: (err) => {
                toast.error('Failed to create lesson: ' + err.message);
            },
        });
    }


    const handleUpdateMyCourseLesson = (lessonData: CreateMyLesson) => {
        if (editingLesson) {
            mutationUpdateMyCourseLesson.mutate({ courseId: id, lessonId: editingLesson?.id, lesson: lessonData }, {
                onSuccess: () => {
                    loadCourse();
                    setEditingLesson(undefined);
                    setLessonFormOpen(false);
                    toast.success('Lesson updated successfully');
                },
                onError: (err) => {
                    toast.error('Failed to update lesson: ' + err.message);
                },
            });
        } else {
            toast.error('Lesson not found');
        }
    }

    const handleDeleteMyCourseLesson = () => {
        if (deleteConfirm && deleteConfirm.type === 'lesson') {
            mutationDeleteMyCourseLesson.mutate({ courseId: id, lessonId: deleteConfirm.item.id }, {
                onSuccess: () => {
                    loadCourse();
                    setDeleteConfirm(null);
                    toast.success('Lesson deleted successfully');
                },
                onError: (err) => {
                    toast.error('Failed to delete lesson: ' + err.message);
                },
            });
        }
    }

    const handleCreateMyWord = (wordData: CreateMyWord) => {
        if (activeLesson) {
            mutationCreateMyWord.mutate({ courseId: id, lessonId: activeLesson?.id, word: wordData }, {
                onSuccess: () => {
                    loadCourse();
                    setActiveLesson(undefined);
                    setWordFormOpen(false);
                    toast.success('Word created successfully');
                },
                onError: (err) => {
                    toast.error('Failed to create word: ' + err.message);
                },
            });
        }
    }

    const handleUpdateMyWord = (wordData: CreateMyWord) => {
        if (editingWord && activeLesson) {
            mutationUpdateMyWord.mutate({ courseId: id, lessonId: activeLesson?.id, wordId: editingWord?.id, word: wordData }, {
                onSuccess: () => {
                    loadCourse();
                    setEditingWord(undefined);
                    setActiveLesson(undefined);
                    setWordFormOpen(false);
                    toast.success('Word updated successfully');
                },
                onError: (err) => {
                    toast.error('Failed to update word: ' + err.message);
                },
            });
        }
    }

    const handleDeleteMyWord = () => {
        if (deleteConfirm && deleteConfirm.type === 'word' && activeLesson) {
            mutationDeleteMyWord.mutate({ courseId: id, lessonId: activeLesson?.id, wordId: deleteConfirm.item.id }, {
                onSuccess: () => {
                    loadCourse();
                    setDeleteConfirm(null);
                    setActiveLesson(undefined);
                    toast.success('Word deleted successfully');
                },
                onError: (err) => {
                    toast.error('Failed to delete word: ' + err.message);
                },
            });
        }
    }

    const handleMoveWord = (targetLessonId: string) => {
        if (moveWordDialog) {
            const { word, sourceLesson } = moveWordDialog;
            moveWord(sourceLesson.id, targetLessonId, word.id);
            loadCourse();
            setMoveWordDialog(null);
        }
    };

    if (isLoading || isError) {
        return <LoadingSection isLoading={isLoading} error={isError ? 'Error loading course' : null} refetch={loadCourse} />;
    }

    if (!course) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Course not found</h2>
                    <Button onClick={() => router.push('/manage/courses')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Courses
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <Button variant="ghost" onClick={() => router.push('/manage/courses')} className="mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Courses
                </Button>

                {/* Course Header */}
                <div className="bg-card border-2 border-border rounded-2xl overflow-hidden mb-8">
                    {course.coverImageUrl && (
                        <div className="relative w-full h-48 bg-muted">
                            <img
                                src={course.coverImageUrl}
                                alt={course.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        </div>
                    )}
                    <div className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
                                <p className="text-muted-foreground">
                                    {lessons.length} lessons • {lessons.reduce((sum, l) => sum + (l.words?.length || 0), 0)} words
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setCourseFormOpen(true)}
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Course
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteCourseConfirm(true)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Course
                                </Button>
                                <Button
                                    onClick={() => {
                                        setEditingLesson(undefined);
                                        setLessonFormOpen(true);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Lesson
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lessons List */}
                {lessons.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-muted/30">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
                        <p className="text-muted-foreground mb-6">Create your first lesson to start adding vocabulary</p>
                        <Button onClick={() => setLessonFormOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Lesson
                        </Button>
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-4">
                                {lessons.map((lesson) => (
                                    <SortableLesson
                                        key={lesson.id}
                                        lesson={lesson}
                                        isExpanded={expandedLessons.has(lesson.id)}
                                        onToggle={() => toggleLesson(lesson.id)}
                                        onEdit={() => {
                                            setEditingLesson(lesson);
                                            setLessonFormOpen(true);
                                        }}
                                        onDelete={() => setDeleteConfirm({ type: 'lesson', item: lesson })}
                                        onAddWord={() => {
                                            setActiveLesson(lesson);
                                            setEditingWord(undefined);
                                            setWordFormOpen(true);
                                        }}
                                        onEditWord={(word) => {
                                            setActiveLesson(lesson);
                                            setEditingWord(word);
                                            setWordFormOpen(true);
                                        }}
                                        onDeleteWord={(word) => {
                                            setActiveLesson(lesson);
                                            setDeleteConfirm({ type: 'word', item: word });
                                        }}
                                        onMoveWord={(word) => {
                                            setMoveWordDialog({ word, sourceLesson: lesson });
                                        }}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Dialogs */}
            <CourseFormDialog
                isOpen={courseFormOpen}
                onClose={() => setCourseFormOpen(false)}
                onSubmit={(courseData) => handleUpdateMyCourse(course.id, courseData)}
                course={course}
                isLoading={mutationUpdateMyCourse.isPending}
                title="Edit Course"
            />

            <LessonFormDialog
                isLoading={mutationCreateMyCourseLesson.isPending || mutationUpdateMyCourseLesson.isPending}
                isOpen={lessonFormOpen}
                onClose={() => {
                    setLessonFormOpen(false);
                    setEditingLesson(undefined);
                }}
                onSubmit={editingLesson ? handleUpdateMyCourseLesson : handleCreateMyCourseLesson}
                lesson={editingLesson}
                title={editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
            />

            <WordFormDialog
                isOpen={wordFormOpen}
                onClose={() => {
                    setWordFormOpen(false);
                    setEditingWord(undefined);
                    setActiveLesson(undefined);
                }}
                onSubmit={editingWord ? handleUpdateMyWord : handleCreateMyWord}
                word={editingWord}
                title={editingWord ? 'Edit Word' : 'Add New Word'}
                isLoading={mutationCreateMyWord.isPending || mutationUpdateMyWord.isPending}
            />

            {deleteConfirm && (
                <ConfirmDialog
                    isLoading={mutationDeleteMyCourseLesson.isPending || mutationDeleteMyWord.isPending}
                    isOpen={!!deleteConfirm}
                    onClose={() => {
                        setDeleteConfirm(null);
                        setActiveLesson(undefined);
                    }}
                    onConfirm={deleteConfirm.type === 'lesson' ? handleDeleteMyCourseLesson : handleDeleteMyWord}
                    title={deleteConfirm.type === 'lesson' ? 'Delete Lesson' : 'Delete Word'}
                    description={
                        deleteConfirm.type === 'lesson'
                            ? `Are you sure you want to delete "${(deleteConfirm.item as ILesson).name}"? This will also delete all words in this lesson.`
                            : `Are you sure you want to delete "${(deleteConfirm.item as IWord).word}"?`
                    }
                    confirmText={`Delete ${deleteConfirm.type === 'lesson' ? 'Lesson' : 'Word'}`}
                    variant="destructive"
                />
            )}

            <ConfirmDialog
                isLoading={mutationDeleteMyCourse.isPending}
                isOpen={deleteCourseConfirm}
                onClose={() => setDeleteCourseConfirm(false)}
                onConfirm={() => handleDeleteMyCourse(course.id)}
                title="Delete Course"
                description={`Are you sure you want to delete "${course.name}"? This will permanently delete the course and all its lessons and words. This action cannot be undone.`}
                confirmText="Delete Course"
                variant="destructive"
            />

            <MoveWordDialog
                isOpen={!!moveWordDialog}
                onClose={() => setMoveWordDialog(null)}
                onConfirm={handleMoveWord}
                word={moveWordDialog?.word || null}
                currentLesson={moveWordDialog?.sourceLesson || null}
                availableLessons={lessons.filter(l => l.id !== moveWordDialog?.sourceLesson.id)}
            />
        </main>
    );
}
