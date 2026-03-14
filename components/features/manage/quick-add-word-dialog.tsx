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
import { useGetCourseDetailByIdQuery, useGetMyCoursesQuery } from "@/queries/courses.query";
import { CreateMyWord, ICourse, ILesson, WordDetailView } from "@/types/courses/courses.type";
import { useCallback, useEffect, useState } from "react";
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

    const { data: coursesPage } = useGetMyCoursesQuery(100, 1, "name", "asc", "", isOpen);
    const courses: ICourse[] = coursesPage?.items ?? [];

    const { data: selectedCourse } = useGetCourseDetailByIdQuery(
        selectedCourseId,
        isOpen && !!selectedCourseId
    );
    const lessons: ILesson[] = selectedCourse?.lessons ?? [];

    useEffect(() => {
        const initial = () => {
            if (!isOpen) {
                setSelectedCourseId("");
                setSelectedLessonId("");
                setWordFormOpen(false);
            }
        }
        initial();
    }, [isOpen]);

    useEffect(() => {
        const initial = () => {
            if (!selectedCourseId || !lessons.some((l) => l.id === selectedLessonId)) {
                setSelectedLessonId("");
            }
        }
        initial();
    }, [selectedCourseId, lessons, selectedLessonId]);

    const { mutationCreateMyWord } = useWords();

    const handleSubmitWord = useCallback(
        (wordData: CreateMyWord) => {
            if (!selectedCourseId || !selectedLessonId) return;
            mutationCreateMyWord.mutate(
                { courseId: selectedCourseId, lessonId: selectedLessonId, word: wordData },
                {
                    onSuccess: () => {
                        setWordFormOpen(false);
                        onClose();
                        toast.success("Word added successfully");
                    },
                    onError: (err) => {
                        toast.error("Failed to add word: " + (err as Error).message);
                    },
                }
            );
        },
        [selectedCourseId, selectedLessonId, mutationCreateMyWord, onClose]
    );

    const handleOpenWordForm = () => {
        setWordFormOpen(true);
    };

    if (!initialWord) return null;

    const canAdd = !!selectedCourseId && !!selectedLessonId;
    const isLoadingCreate = mutationCreateMyWord.isPending;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
                            <select
                                id="quick-add-course"
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="">Select course</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                        {c.totalWordsCount != null ? ` (${c.totalWordsCount} words)` : ""}
                                    </option>
                                ))}
                            </select>
                            {courses.length === 0 && (
                                <p className="text-xs text-muted-foreground">No courses yet. Create one in Manage.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quick-add-lesson">Lesson</Label>
                            <select
                                id="quick-add-lesson"
                                value={selectedLessonId}
                                onChange={(e) => setSelectedLessonId(e.target.value)}
                                disabled={!selectedCourseId}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">Select lesson</option>
                                {lessons.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.name} ({(l.words?.length ?? 0)} words)
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
