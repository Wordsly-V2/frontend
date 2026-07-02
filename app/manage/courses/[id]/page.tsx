"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { courseWordFocusSearchParams } from "@/lib/search-params/course-word-focus";
import { handleAudioPlayError } from "@/lib/audio-playback";
import { useQueryStates } from "nuqs";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import { FloatingActionMenu } from "@/components/common/floating-action-menu";
import LoadingSection from "@/components/common/loading-section/loading-section";
import { LearningProgressSection, WordProgressBadge, WordProgressStatsInline } from "@/components/common/word-progress-stats";
import CourseFormDialog from "@/components/features/manage/course-form-dialog";
import ExportWordsDialog from "@/components/features/manage/export-words-dialog";
import LessonFormDialog from "@/components/features/manage/lesson-form-dialog";
import MoveWordDialog from "@/components/features/manage/move-word-dialog";
import WordFormDialog from "@/components/features/manage/word-form-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useCourses } from "@/hooks/useCourses.hook";
import { useLessons } from "@/hooks/useLessons.hook";
import { useLoadingOverlay } from "@/hooks/useLoadingOverlay.hook";
import { useWords } from "@/hooks/useWords.hook";
import { getCourseDetailById } from "@/apis/courses.api";
import { useCourseWordProgress } from "@/hooks/useCourseWordProgress.hook";
import { useGetCourseDetailByIdQuery, useGetMyCoursesQuery } from "@/queries/courses.query";
import type { IWordProgressResponse, IWordProgressStats } from "@/types/word-progress/word-progress.type";
import { useQueries } from "@tanstack/react-query";
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
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import WordDetailDialog from "@/components/features/manage/word-detail-dialog";
import { setLastManageCourse } from "@/lib/manage-session";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, ArrowRightLeft, BookOpen, ChevronDown, ChevronRight, Download, Edit, Eye, GripVertical, MoreHorizontal, Plus, Search, Trash2, Volume2, X } from "lucide-react";
import Link from "next/link";
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
    onViewWord,
    selectedWords,
    onToggleWordSelection,
    onSelectAllWords,
    dragDisabled = false,
    lessonWordProgressStats,
    wordProgressByWordId = {},
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
    onViewWord: (word: IWord) => void;
    selectedWords: Set<string>;
    onToggleWordSelection: (lessonId: string, wordId: string) => void;
    onSelectAllWords: (lessonId: string, selectAll: boolean) => void;
    dragDisabled?: boolean;
    lessonWordProgressStats?: IWordProgressStats;
    wordProgressByWordId?: Record<string, IWordProgressResponse | null>;
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
    const lessonSelectedWords = words.filter(w => selectedWords.has(`${lesson.id}-${w.id}`));
    const allWordsSelected = words.length > 0 && lessonSelectedWords.length === words.length;

    return (
        <div ref={setNodeRef} id={`lesson-${lesson.id}`} style={style} className="bg-card border-2 border-border rounded-xl sm:rounded-2xl overflow-hidden scroll-mt-24">
            {/* Lesson Header */}
            <div className="p-3 sm:p-4 bg-muted/30 flex items-center gap-2 sm:gap-3">
                {!dragDisabled ? (
                    <button className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0" {...attributes} {...listeners}>
                        <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    </button>
                ) : (
                    <span className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden />
                )}
                <button
                    onClick={onToggle}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                </button>
                {lesson.coverImageUrl && (
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                            src={lesson.coverImageUrl}
                            alt={lesson.name}
                            fill
                            loading="lazy"
                            className="object-cover"
                            sizes="(max-width: 640px) 48px, 64px"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate">{lesson.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        {words.length} words {lesson.maxWords && `• Max: ${lesson.maxWords}`}
                    </p>
                    {lessonWordProgressStats && words.length > 0 && (
                        <WordProgressStatsInline
                            stats={lessonWordProgressStats}
                            totalWords={words.length}
                            className="mt-1.5"
                        />
                    )}
                </div>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={onAddWord} className="text-xs h-8 px-2 sm:px-3" disabled={!!(lesson.maxWords && words.length >= lesson.maxWords)}>
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Add Word</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={onEdit} className="h-8 w-8 sm:w-auto p-0 sm:px-3">
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive hover:text-destructive h-8 w-8 sm:w-auto p-0 sm:px-3">
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                </div>
            </div>

            {/* Words List */}
            {isExpanded && words.length > 0 && (
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {/* Bulk Actions Bar */}
                    {lessonSelectedWords.length > 0 && (
                        <div className="flex items-center justify-between p-2 sm:p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Checkbox
                                    checked={allWordsSelected}
                                    onCheckedChange={(checked) => onSelectAllWords(lesson.id, !!checked)}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <span className="text-xs sm:text-sm font-medium">
                                    {lessonSelectedWords.length} word{lessonSelectedWords.length !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onSelectAllWords(lesson.id, false)}
                                className="text-muted-foreground h-7 w-7 p-0 sm:h-8 sm:w-8"
                            >
                                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                        </div>
                    )}

                    {words.map((word) => {
                        const isSelected = selectedWords.has(`${lesson.id}-${word.id}`);
                        return (
                            <div
                                key={word.id}
                                className={`flex flex-col gap-2 p-3 sm:p-4 bg-background border rounded-lg transition-colors ${isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => onToggleWordSelection(lesson.id, word.id)}
                                        className="mt-0.5 sm:mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0"
                                    />
                                    {word.imageUrl && (
                                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0 border border-border">
                                            <Image
                                                src={word.imageUrl}
                                                alt=""
                                                fill
                                                loading="lazy"
                                                className="object-cover"
                                                sizes="(max-width: 640px) 48px, 56px"
                                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                                            />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                                            <span className="font-semibold text-sm sm:text-base break-words">{word.word}</span>
                                            {word.partOfSpeech && (
                                                <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">
                                                    {word.partOfSpeech}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs sm:text-sm text-foreground mb-1 break-words">{word.meaning}</p>
                                        {word.pronunciation && (
                                            <p className="text-xs text-muted-foreground break-all">
                                                {word.pronunciation}
                                            </p>
                                        )}
                                        {wordProgressByWordId[word.id] && (
                                            <WordProgressBadge
                                                progress={wordProgressByWordId[word.id]!}
                                                className="mt-1.5"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center gap-2 border-t border-border/50 pt-2 -mb-0.5">
                                    <div className="flex gap-0.5 sm:gap-1">
                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEditWord(word); }} className="h-7 w-7 p-0 sm:h-8 sm:w-8" title="Edit word">
                                            <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMoveWord(word);
                                            }}
                                            title="Move to another lesson"
                                            className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                                        >
                                            <ArrowRightLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => { e.stopPropagation(); onDeleteWord(word); }}
                                            className="text-destructive hover:text-destructive h-7 w-7 p-0 sm:h-8 sm:w-8"
                                            title="Delete word"
                                        >
                                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-0.5 sm:gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => { e.stopPropagation(); onViewWord(word); }}
                                            className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                                            title="View word detail"
                                        >
                                            <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                        </Button>
                                        {word.audioUrl && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const audio = new Audio(word.audioUrl);
                                                    audio.play().catch(handleAudioPlayError);
                                                }}
                                                className="text-primary hover:text-primary h-7 w-7 p-0 sm:h-8 sm:w-8"
                                            >
                                                <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isExpanded && words.length === 0 && (
                <div className="p-6 sm:p-8 text-center text-muted-foreground">
                    <p className="text-xs sm:text-sm">No words yet. Click &ldquo;Add Word&rdquo; to get started.</p>
                </div>
            )}
        </div>
    );
}

export default function ManageCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [{ word: searchQuery, lessonId: urlLessonId }, setSearchParams] = useQueryStates(
        courseWordFocusSearchParams,
        { history: "replace" },
    );
    const appliedFocusRef = useRef(false);
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
    const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());

    // Dialog states
    const [courseFormOpen, setCourseFormOpen] = useState(false);
    const [deleteCourseConfirm, setDeleteCourseConfirm] = useState(false);
    const [lessonFormOpen, setLessonFormOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<ILesson | undefined>();
    const [wordFormOpen, setWordFormOpen] = useState(false);
    const [editingWord, setEditingWord] = useState<IWord | undefined>();
    const [activeLesson, setActiveLesson] = useState<ILesson | undefined>();
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'lesson' | 'word' | 'bulk-words'; item: ILesson | IWord | null; lessonId?: string } | null>(null);
    const [moveWordDialog, setMoveWordDialog] = useState<{ words: IWord[]; sourceLesson?: ILesson } | null>(null);
    const [exportWordsDialogOpen, setExportWordsDialogOpen] = useState(false);
    const [viewingWord, setViewingWord] = useState<IWord | null>(null);
    const [bulkActionsOpen, setBulkActionsOpen] = useState(false);

    const { data: course, isLoading, isError, refetch: loadCourseDetail } = useGetCourseDetailByIdQuery(id, !!id);

    useEffect(() => {
        if (course) {
            setLastManageCourse({ id: course.id, name: course.name });
        }
    }, [course]);
    const {
        courseStats,
        lessonStatsByLessonId,
        wordProgressByWordId,
    } = useCourseWordProgress(course, !!course);
    const { mutationUpdateMyCourse, mutationDeleteMyCourse } = useCourses();

    // When move dialog is open, fetch other courses and their lessons for cross-course move
    const { data: coursesList } = useGetMyCoursesQuery(50, 1, "name", "asc", "", !!moveWordDialog);
    const otherCourseIds = moveWordDialog
        ? (coursesList?.items ?? []).filter((c: ICourse) => c.id !== id).map((c: ICourse) => c.id)
        : [];
    const otherCoursesDetailsQueries = useQueries({
        queries: otherCourseIds.map((courseId: string) => ({
            queryKey: ["courses", "get", "course-detail", courseId],
            queryFn: () => getCourseDetailById(courseId),
            enabled: !!moveWordDialog && !!courseId,
        })),
    });
    const otherCoursesWithLessons: { courseId: string; courseName: string; lessons: ILesson[] }[] =
        otherCoursesDetailsQueries
            .map((q, i) => ({ courseId: otherCourseIds[i], data: q.data as ICourse | undefined }))
            .filter(({ data }) => data != null)
            .map(({ courseId, data }) => ({
                courseId,
                courseName: data!.name,
                lessons: data!.lessons ?? [],
            }));
    const isLoadingOtherCourses = otherCoursesDetailsQueries.some((q) => q.isLoading);

    // When opening from nav word search: expand the target lesson
    useEffect(() => {
        if (!course || !urlLessonId) return;
        const lessonExists = course.lessons?.some((l: ILesson) => l.id === urlLessonId);
        if (!lessonExists) return;
        setExpandedLessons((prev) => new Set(prev).add(urlLessonId));
    }, [course, urlLessonId]);

    // Scroll to lesson after expand state has been applied
    useEffect(() => {
        if (!course || !searchQuery || !urlLessonId || appliedFocusRef.current) return;
        if (!expandedLessons.has(urlLessonId)) return;
        appliedFocusRef.current = true;

        function tryScroll(attempt: number) {
            const el = document.getElementById(`lesson-${urlLessonId}`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
            }
            if (attempt < 20) setTimeout(() => tryScroll(attempt + 1), 100);
        }
        const t = setTimeout(() => tryScroll(0), 50);
        return () => clearTimeout(t);
    }, [course, searchQuery, urlLessonId, expandedLessons]);
    const { mutationCreateMyCourseLesson, mutationUpdateMyCourseLesson, mutationDeleteMyCourseLesson, mutationReorderMyCourseLessons } = useLessons();
    const { mutationCreateMyWord, mutationUpdateMyWord, mutationDeleteMyWord, mutationBulkDeleteMyWords, mutationBulkDeleteMyWordsFromCourse, mutationBulkMoveMyWordsFromCourse } = useWords();

    useLoadingOverlay({ isPending: mutationReorderMyCourseLessons.isPending, label: "Reordering lessons..." });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
            const newIndex = (course?.lessons?.findIndex((l: ILesson) => l.id === over.id) || 0) + 1;

            mutationReorderMyCourseLessons.mutate({ courseId: id, lessonId: active.id as string, targetOrderIndex: newIndex }, {
                onSuccess: () => {
                    loadCourseDetail();
                    toast.success('Lessons reordered successfully');
                },
                onError: (err) => {
                    toast.error('Failed to reorder lessons: ' + err.message);
                }
            });
        }
    };

    const handleUpdateMyCourse = (courseId: string, courseData: Pick<ICourse, 'name' | 'coverImageUrl'>) => {
        mutationUpdateMyCourse.mutate({ courseId, courseData }, {
            onSuccess: () => {
                loadCourseDetail();
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
                loadCourseDetail();
                setDeleteCourseConfirm(false);
                router.push('/manage');
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
                loadCourseDetail();
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
                    loadCourseDetail();
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
        if (deleteConfirm && deleteConfirm.type === 'lesson' && deleteConfirm.item) {
            const lessonItem = deleteConfirm.item as ILesson;
            mutationDeleteMyCourseLesson.mutate({ courseId: id, lessonId: lessonItem.id }, {
                onSuccess: () => {
                    loadCourseDetail();
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
                    loadCourseDetail();
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
                    loadCourseDetail();
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
        if (deleteConfirm && deleteConfirm.type === 'word' && activeLesson && deleteConfirm.item) {
            const wordItem = deleteConfirm.item as IWord;
            mutationDeleteMyWord.mutate({ courseId: id, lessonId: activeLesson?.id, wordId: wordItem.id }, {
                onSuccess: () => {
                    loadCourseDetail();
                    setDeleteConfirm(null);
                    setActiveLesson(undefined);
                    toast.success('Word deleted successfully');
                },
                onError: (err) => {
                    toast.error('Failed to delete word: ' + err.message);
                },
            });
        } else if (deleteConfirm && deleteConfirm.type === 'bulk-words') {
            handleBulkDeleteWords();
        }
    }

    const handleMoveMyWord = (targetLessonId: string) => {
        if (moveWordDialog) {
            const { words } = moveWordDialog;
            const wordIds = words.map((w) => w.id);
            // Use course-level bulk move (supports words from any lesson; target can be in any course)
            mutationBulkMoveMyWordsFromCourse.mutate(
                { courseId: id, wordIds, targetLessonId },
                {
                    onSuccess: () => {
                        loadCourseDetail();
                        setMoveWordDialog(null);
                        setSelectedWords(new Set());
                        toast.success(words.length === 1 ? "Word moved successfully" : `${words.length} words moved successfully`);
                    },
                    onError: (err) => {
                        toast.error("Failed to move words: " + (err as Error).message);
                    },
                }
            );
        }
    };

    const handleBulkDeleteWords = () => {
        if (deleteConfirm?.type !== 'bulk-words') return;
        const wordsToDelete = getSelectedWordsAcrossCourse();
        const wordIds = wordsToDelete.map((w: IWord) => w.id);
        if (wordIds.length === 0) {
            setDeleteConfirm(null);
            return;
        }
        mutationBulkDeleteMyWordsFromCourse.mutate(
            { courseId: id, wordIds },
            {
                onSuccess: (data) => {
                    loadCourseDetail();
                    setDeleteConfirm(null);
                    setSelectedWords(new Set());
                    toast.success(`${data.count} word${data.count !== 1 ? 's' : ''} deleted successfully`);
                },
                onError: (err) => {
                    toast.error('Failed to delete words: ' + (err as Error).message);
                },
            }
        );
    };

    const toggleWordSelection = (lessonId: string, wordId: string) => {
        const key = `${lessonId}-${wordId}`;
        const newSelected = new Set(selectedWords);
        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }
        setSelectedWords(newSelected);
    };

    const selectAllWordsInLesson = (lessonId: string, selectAll: boolean) => {
        const lesson = course?.lessons?.find((l: ILesson) => l.id === lessonId);
        if (!lesson) return;

        const newSelected = new Set(selectedWords);
        lesson.words?.forEach(word => {
            const key = `${lessonId}-${word.id}`;
            if (selectAll) {
                newSelected.add(key);
            } else {
                newSelected.delete(key);
            }
        });
        setSelectedWords(newSelected);
    };

    const getSelectedWordsForLesson = (lessonId: string): IWord[] => {
        const lesson = course?.lessons?.find((l: ILesson) => l.id === lessonId);
        if (!lesson) return [];
        return lesson.words?.filter(w => selectedWords.has(`${lessonId}-${w.id}`)) || [];
    };

    /** All selected words across the whole course (for cross-lesson bulk move/delete). */
    const getSelectedWordsAcrossCourse = (): IWord[] => {
        if (!course?.lessons) return [];
        return course.lessons.flatMap((lesson: ILesson) =>
            (lesson.words ?? []).filter((w: IWord) => selectedWords.has(`${lesson.id}-${w.id}`))
        );
    };

    if (isLoading || isError) {
        return <LoadingSection isLoading={isLoading} error={isError ? 'Error loading course' : null} refetch={loadCourseDetail} />;
    }

    if (!course) {
        return (
            <main className="min-h-dvh bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Course not found</h2>
                    <Button onClick={() => router.push('/manage')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Courses
                    </Button>
                </div>
            </main>
        );
    }

    const q = (searchQuery ?? "").trim().toLowerCase();
    const wordMatchesSearch = (w: IWord) =>
        !q ||
        [w.word, w.meaning, w.pronunciation].some(
            (v) => v && String(v).toLowerCase().includes(q)
        );
    const filteredLessons: ILesson[] =
        !q
            ? course.lessons ?? []
            : (course.lessons ?? [])
                .map((lesson) => ({
                    ...lesson,
                    words: (lesson.words ?? []).filter(wordMatchesSearch),
                }))
                .filter((lesson) => lesson.words!.length > 0);

    const selectedByLesson = new Map<string, IWord[]>();
    course.lessons?.forEach((lesson: ILesson) => {
        const selectedInLesson = getSelectedWordsForLesson(lesson.id);
        if (selectedInLesson.length > 0) {
            selectedByLesson.set(lesson.id, selectedInLesson);
        }
    });
    const totalSelected = Array.from(selectedByLesson.values()).reduce((sum, words) => sum + words.length, 0);

    return (
        <main className="min-h-dvh bg-background">
            <div className={`container mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6 md:py-8 ${selectedWords.size > 0 ? "pb-fab-safe" : ""}`}>
                <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground sm:mb-6">
                    <Link
                        href="/manage"
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Manage
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate font-medium text-foreground">{course.name}</span>
                </nav>

                {/* Course Header */}
                <div className="mb-6 overflow-hidden rounded-2xl border-2 border-border bg-card sm:mb-8">
                    {course.coverImageUrl && (
                        <div className="relative h-36 w-full bg-muted sm:h-44">
                            <Image
                                src={course.coverImageUrl}
                                alt={course.name}
                                fill
                                loading="lazy"
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 1024px"
                                onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                        </div>
                    )}
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    Course content
                                </p>
                                <h1 className="mb-1 break-words text-2xl font-bold sm:text-3xl">{course.name}</h1>
                                <p className="text-sm text-muted-foreground sm:text-base">
                                    {course?.lessons?.length || 0} lessons ·{" "}
                                    {course?.lessons?.reduce((sum, l) => sum + (l.words?.length || 0), 0) || 0} words
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={() => {
                                        setEditingLesson(undefined);
                                        setLessonFormOpen(true);
                                    }}
                                    size="sm"
                                    className="w-full rounded-xl text-xs sm:w-auto sm:text-sm"
                                >
                                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                                    Add lesson
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full rounded-xl text-xs sm:w-auto sm:text-sm"
                                    asChild
                                >
                                    <Link href={`/learn/courses/${course.id}`}>
                                        <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                                        Study course
                                    </Link>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl"
                                            aria-label="More course actions"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem
                                            onClick={() => setExportWordsDialogOpen(true)}
                                            disabled={!course?.lessons?.length}
                                        >
                                            <Download className="h-4 w-4" />
                                            Export words
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setCourseFormOpen(true)}>
                                            <Edit className="h-4 w-4" />
                                            Edit course
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onClick={() => setDeleteCourseConfirm(true)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete course
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>

                {courseStats ? (
                    <LearningProgressSection
                        stats={courseStats}
                        title="Learner progress"
                        className="mb-6 sm:mb-8"
                    />
                ) : null}

                {(course?.lessons?.reduce((sum, l) => sum + (l.words?.length || 0), 0) ?? 0) > 0 ? (
                    <div className="relative mb-4 sm:mb-6">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            inputMode="search"
                            placeholder="Search words by text, meaning, or pronunciation…"
                            value={searchQuery ?? ""}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchParams({
                                    word: value || null,
                                    lessonId: null,
                                });
                            }}
                            className="h-10 pl-9"
                            aria-label="Search words"
                        />
                    </div>
                ) : null}

                <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Lessons</h2>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            Drag to reorder · expand to edit words
                        </p>
                    </div>
                </div>
                {course?.lessons?.length === 0 && (
                    <div className="text-center py-12 sm:py-16 border-2 border-dashed border-border rounded-xl sm:rounded-2xl bg-muted/30 px-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-muted mb-3 sm:mb-4">
                            <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">No lessons yet</h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Create your first lesson to start adding vocabulary</p>
                        <Button onClick={() => setLessonFormOpen(true)} size="sm" className="text-sm sm:text-base">
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                            Create First Lesson
                        </Button>
                    </div>
                )}

                {
                    !!(course?.lessons?.length && filteredLessons.length === 0) && (
                        <div className="text-center py-12 sm:py-16 border-2 border-dashed border-border rounded-xl sm:rounded-2xl bg-muted/30 px-4">
                            <p className="text-sm sm:text-base text-muted-foreground">No words match your search</p>
                        </div>
                    )
                }

                {
                    !!(course?.lessons?.length && filteredLessons.length) && (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={course?.lessons?.map((l: ILesson) => l.id) || []} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3 sm:space-y-4">
                                    {filteredLessons.map((lesson: ILesson) => (
                                        <SortableLesson
                                            key={lesson.id}
                                            lesson={lesson}
                                            dragDisabled={!!q}
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
                                                setMoveWordDialog({ words: [word], sourceLesson: lesson });
                                            }}
                                            onViewWord={(word) => setViewingWord(word)}
                                            selectedWords={selectedWords}
                                            onToggleWordSelection={toggleWordSelection}
                                            onSelectAllWords={selectAllWordsInLesson}
                                            lessonWordProgressStats={lessonStatsByLessonId[lesson.id]}
                                            wordProgressByWordId={wordProgressByWordId}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )
                }
            </div>

            {selectedWords.size > 0 && (
                <FloatingActionMenu
                    open={bulkActionsOpen}
                    onOpenChange={setBulkActionsOpen}
                    title={`${totalSelected} word${totalSelected !== 1 ? "s" : ""} selected`}
                    description={`${selectedByLesson.size} lesson${selectedByLesson.size !== 1 ? "s" : ""}`}
                    badge={totalSelected}
                    triggerIcon={<MoreHorizontal className="h-5 w-5" />}
                    triggerLabel="Open bulk actions"
                >
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setBulkActionsOpen(false);
                                setMoveWordDialog({ words: getSelectedWordsAcrossCourse() });
                            }}
                            className="h-11 flex-1 rounded-xl px-4 text-sm"
                        >
                            <ArrowRightLeft className="h-4 w-4 mr-2" />
                            Move
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setBulkActionsOpen(false);
                                setDeleteConfirm({ type: "bulk-words", item: null });
                            }}
                            className="h-11 flex-1 rounded-xl px-4 text-sm text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setBulkActionsOpen(false);
                                setSelectedWords(new Set());
                            }}
                            className="h-11 rounded-xl px-4 text-sm"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear selection
                        </Button>
                    </div>
                </FloatingActionMenu>
            )}

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

            {deleteConfirm && (() => {
                let title = 'Delete Word';
                let description = '';
                let confirmText = 'Delete Word';

                if (deleteConfirm.type === 'lesson') {
                    title = 'Delete Lesson';
                    description = `Are you sure you want to delete "${(deleteConfirm.item as ILesson).name}"? This will also delete all words in this lesson.`;
                    confirmText = 'Delete Lesson';
                } else if (deleteConfirm.type === 'bulk-words') {
                    title = 'Delete Words';
                    const count = getSelectedWordsAcrossCourse().length;
                    description = `Are you sure you want to delete ${count} selected word${count !== 1 ? 's' : ''}? This action cannot be undone.`;
                    confirmText = 'Delete Words';
                } else {
                    description = `Are you sure you want to delete "${(deleteConfirm.item as IWord)?.word}"?`;
                }

                return (
                    <ConfirmDialog
                        isLoading={mutationDeleteMyCourseLesson.isPending || mutationDeleteMyWord.isPending || mutationBulkDeleteMyWords.isPending || mutationBulkDeleteMyWordsFromCourse.isPending}
                        isOpen={true}
                        onClose={() => {
                            setDeleteConfirm(null);
                            setActiveLesson(undefined);
                        }}
                        onConfirm={deleteConfirm.type === 'lesson' ? handleDeleteMyCourseLesson : handleDeleteMyWord}
                        title={title}
                        description={description}
                        confirmText={confirmText}
                        variant="destructive"
                    />
                );
            })()}

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
                isLoading={mutationBulkMoveMyWordsFromCourse.isPending}
                isOpen={!!moveWordDialog}
                onClose={() => setMoveWordDialog(null)}
                onConfirm={handleMoveMyWord}
                words={moveWordDialog?.words || []}
                currentLesson={moveWordDialog?.sourceLesson ?? null}
                availableLessons={moveWordDialog?.sourceLesson
                    ? (course?.lessons?.filter((l: ILesson) => l.id !== moveWordDialog?.sourceLesson?.id) ?? [])
                    : (course?.lessons ?? [])}
                otherCoursesWithLessons={otherCoursesWithLessons}
                isLoadingOtherCourses={isLoadingOtherCourses}
            />

            <ExportWordsDialog
                isOpen={exportWordsDialogOpen}
                onClose={() => setExportWordsDialogOpen(false)}
                lessons={course?.lessons || []}
                courseName={course?.name ?? ""}
            />
            {viewingWord && (
                <WordDetailDialog word={viewingWord} isOpen={!!viewingWord} onClose={() => setViewingWord(null)} />
            )}
        </main>
    );
}
