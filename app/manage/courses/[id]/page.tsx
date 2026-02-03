"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Edit, Trash2, GripVertical } from "lucide-react";
import {
    getCourseById,
    createLesson,
    updateLesson,
    deleteLesson,
    createWord,
    updateWord,
    deleteWord,
    reorderLessons,
} from "@/lib/data-store";
import { ICourse, ILesson, IWord } from "@/types/courses/courses.type";
import LessonFormDialog from "@/components/features/manage/lesson-form-dialog";
import WordFormDialog from "@/components/features/manage/word-form-dialog";
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
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableLesson({
    lesson,
    onEdit,
    onDelete,
    onAddWord,
    onEditWord,
    onDeleteWord,
}: {
    lesson: ILesson;
    onEdit: () => void;
    onDelete: () => void;
    onAddWord: () => void;
    onEditWord: (word: IWord) => void;
    onDeleteWord: (word: IWord) => void;
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
            {words.length > 0 && (
                <div className="p-4 space-y-2">
                    {words.map((word) => (
                        <div key={word.id} className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{word.word}</span>
                                    {word.partOfSpeech && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                            {word.partOfSpeech}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">{word.meaning}</p>
                            </div>
                            <div className="flex gap-1">
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

            {words.length === 0 && (
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
    const [course, setCourse] = useState<ICourse | undefined>();
    const [lessons, setLessons] = useState<ILesson[]>([]);
    
    // Dialog states
    const [lessonFormOpen, setLessonFormOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<ILesson | undefined>();
    const [wordFormOpen, setWordFormOpen] = useState(false);
    const [editingWord, setEditingWord] = useState<IWord | undefined>();
    const [activeLesson, setActiveLesson] = useState<ILesson | undefined>();
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'lesson' | 'word'; item: ILesson | IWord } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const loadCourse = () => {
        const loaded = getCourseById(id);
        setCourse(loaded);
        setLessons(loaded?.lessons || []);
    };

    useEffect(() => {
        loadCourse();
    }, [id]);

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

    const handleCreateLesson = (lessonData: Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'words' | 'orderIndex'>) => {
        createLesson(id, lessonData);
        loadCourse();
        setLessonFormOpen(false);
    };

    const handleUpdateLesson = (lessonData: Omit<ILesson, 'id' | 'courseId' | 'createdAt' | 'updatedAt' | 'words' | 'orderIndex'>) => {
        if (editingLesson) {
            updateLesson(id, editingLesson.id, lessonData);
            loadCourse();
            setEditingLesson(undefined);
            setLessonFormOpen(false);
        }
    };

    const handleDeleteLesson = () => {
        if (deleteConfirm && deleteConfirm.type === 'lesson') {
            deleteLesson(id, (deleteConfirm.item as ILesson).id);
            loadCourse();
            setDeleteConfirm(null);
        }
    };

    const handleCreateWord = (wordData: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>) => {
        if (activeLesson) {
            createWord(activeLesson.id, wordData);
            loadCourse();
            setActiveLesson(undefined);
            setWordFormOpen(false);
        }
    };

    const handleUpdateWord = (wordData: Omit<IWord, 'id' | 'lessonId' | 'createdAt' | 'updatedAt'>) => {
        if (editingWord && activeLesson) {
            updateWord(activeLesson.id, editingWord.id, wordData);
            loadCourse();
            setEditingWord(undefined);
            setActiveLesson(undefined);
            setWordFormOpen(false);
        }
    };

    const handleDeleteWord = () => {
        if (deleteConfirm && deleteConfirm.type === 'word' && activeLesson) {
            deleteWord(activeLesson.id, (deleteConfirm.item as IWord).id);
            loadCourse();
            setDeleteConfirm(null);
            setActiveLesson(undefined);
        }
    };

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
                <div className="bg-card border-2 border-border rounded-2xl p-6 mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
                            <p className="text-muted-foreground">
                                {lessons.length} lessons • {lessons.reduce((sum, l) => sum + (l.words?.length || 0), 0)} words
                            </p>
                        </div>
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
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Dialogs */}
            <LessonFormDialog
                isOpen={lessonFormOpen}
                onClose={() => {
                    setLessonFormOpen(false);
                    setEditingLesson(undefined);
                }}
                onSubmit={editingLesson ? handleUpdateLesson : handleCreateLesson}
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
                onSubmit={editingWord ? handleUpdateWord : handleCreateWord}
                word={editingWord}
                title={editingWord ? 'Edit Word' : 'Add New Word'}
            />

            {deleteConfirm && (
                <ConfirmDialog
                    isOpen={!!deleteConfirm}
                    onClose={() => {
                        setDeleteConfirm(null);
                        setActiveLesson(undefined);
                    }}
                    onConfirm={deleteConfirm.type === 'lesson' ? handleDeleteLesson : handleDeleteWord}
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
        </main>
    );
}
