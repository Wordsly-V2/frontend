"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useWords } from "@/hooks/useWords.hook";
import {
    useGetLessonsByCourseIdQuery,
    useGetMyCoursesInfiniteQuery,
} from "@/queries/courses.query";
import { CreateMyWord, ICourse, ILessonSummary, WordDetailView } from "@/types/courses/courses.type";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import WordFormDialog from "./word-form-dialog";

export interface QuickAddWordDialogProps {
    isOpen: boolean;
    onClose: () => void;
    /** Word to add (e.g. from dictionary search). Form will be pre-filled. */
    initialWord: WordDetailView | null;
}

export default function QuickAddWordDialog({
    isOpen,
    onClose,
    initialWord,
}: Readonly<QuickAddWordDialogProps>) {
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedLessonId, setSelectedLessonId] = useState<string>("");
    const [wordFormOpen, setWordFormOpen] = useState(false);
    const coursesListRef = useRef<HTMLDivElement>(null);

    const {
        data: coursesInfinite,
        fetchNextPage: fetchNextCoursesPage,
        hasNextPage: hasNextCoursesPage,
        isFetchingNextPage: isFetchingNextCourses,
    } = useGetMyCoursesInfiniteQuery("name", "asc", "", isOpen);
    const courses: ICourse[] =
        coursesInfinite?.pages.flatMap((p) => p.items) ?? [];

    const { data: lessonsData } = useGetLessonsByCourseIdQuery(
        selectedCourseId,
        isOpen && !!selectedCourseId
    );
    const lessons: ILessonSummary[] = lessonsData ?? [];

    const selectedLessonValue =
        lessons.some((l) => l.id === selectedLessonId) ? selectedLessonId : "";

    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (!open) {
                setSelectedCourseId("");
                setSelectedLessonId("");
                setWordFormOpen(false);
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (!isOpen) {
            const id = setTimeout(() => {
                setSelectedCourseId("");
                setSelectedLessonId("");
                setWordFormOpen(false);
            }, 0);
            return () => clearTimeout(id);
        }
    }, [isOpen]);

    const handleCoursesListScroll = useCallback(() => {
        const el = coursesListRef.current;
        if (!el || !hasNextCoursesPage || isFetchingNextCourses) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            fetchNextCoursesPage();
        }
    }, [hasNextCoursesPage, isFetchingNextCourses, fetchNextCoursesPage]);

    const { mutationCreateMyWord } = useWords();

    const handleSubmitWord = useCallback(
        (wordData: CreateMyWord) => {
            if (!selectedCourseId || !selectedLessonValue) return;
            mutationCreateMyWord.mutate(
                { courseId: selectedCourseId, lessonId: selectedLessonValue, word: wordData },
                {
                    onSuccess: () => {
                        setWordFormOpen(false);
                        onClose();
                        toast.success("Word added successfully");
                    },
                    onError: (err) => {
                        const message = err instanceof Error ? err.message : String(err);
                        toast.error("Failed to add word: " + message);
                    },
                }
            );
        },
        [selectedCourseId, selectedLessonValue, mutationCreateMyWord, onClose]
    );

    const handleOpenWordForm = () => {
        setWordFormOpen(true);
    };

    if (!initialWord) return null;

    const canAdd = !!selectedCourseId && !!selectedLessonValue;
    const isLoadingCreate = mutationCreateMyWord.isPending;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">Add word to course</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Choose a course and lesson to add &ldquo;{initialWord.word}&rdquo; to.
                    </p>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="quick-add-course">Course</Label>
                            <div
                                ref={coursesListRef}
                                onScroll={handleCoursesListScroll}
                                className="flex max-h-[180px] w-full flex-col overflow-y-auto rounded-md border border-input bg-transparent py-1 text-sm shadow-sm"
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedCourseId("")}
                                    className={`px-3 py-2 text-left hover:bg-accent ${selectedCourseId === "" ? "bg-accent" : ""}`}
                                >
                                    Select course
                                </button>
                                {courses.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedCourseId(c.id);
                                            setSelectedLessonId("");
                                        }}
                                        className={`px-3 py-2 text-left hover:bg-accent ${selectedCourseId === c.id ? "bg-accent" : ""}`}
                                    >
                                        {c.name}
                                        {c.totalWordsCount != null ? ` (${c.totalWordsCount} words)` : ""}
                                    </button>
                                ))}
                                {isFetchingNextCourses && (
                                    <p className="px-3 py-2 text-xs text-muted-foreground">Loading more…</p>
                                )}
                            </div>
                            {courses.length === 0 && isFetchingNextCourses === false && (
                                <p className="text-xs text-muted-foreground">No courses yet. Create one in Manage.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quick-add-lesson">Lesson</Label>
                            <select
                                id="quick-add-lesson"
                                value={selectedLessonValue}
                                onChange={(e) => setSelectedLessonId(e.target.value)}
                                disabled={!selectedCourseId}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select lesson</option>
                                {lessons.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name} ({l.wordsCount} words)
                                    </option>
                                ))}
                            </select>
                            {selectedCourseId && lessons.length === 0 && (
                                <p className="text-xs text-muted-foreground">No lessons in this course yet.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleOpenWordForm}
                            disabled={!canAdd}
                            className="w-full sm:w-auto text-sm"
                        >
                            Next Step
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <WordFormDialog
                isOpen={wordFormOpen}
                onClose={() => setWordFormOpen(false)}
                onSubmit={handleSubmitWord}
                initialData={initialWord}
                title="Add word"
                isLoading={isLoadingCreate}
            />
        </>
    );
}
