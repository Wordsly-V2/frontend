"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { FilterToggle } from "@/components/features/admin/filter-toggle";
import CourseFormDialog from "@/components/features/manage/course-form-dialog";
import LessonFormDialog from "@/components/features/manage/lesson-form-dialog";
import WordFormDialog from "@/components/features/manage/word-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce.hook";
import { countOf, wordGaps } from "@/lib/admin/vocabulary";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { adminUserSearchParams } from "@/lib/search-params/admin-user";
import { ApiError } from "@/lib/api-error";
import {
    useAdminUserCourseQuery,
    useAdminUserCoursesQuery,
    useDeleteAdminUserCourseMutation,
    useDeleteAdminUserLessonMutation,
    useDeleteAdminUserWordsMutation,
    useUpdateAdminUserCourseMutation,
    useUpdateAdminUserLessonMutation,
    useUpdateAdminUserWordMutation,
} from "@/queries/admin-vocabulary.query";
import type { ICourse, ILesson, IWord } from "@/types/courses/courses.type";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Pencil, Search, Trash2 } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { LessonSection, WORD_FILTERS, type WordFilter } from "@/components/features/admin-vocabulary/course-content";
import { DetailSection, Fact, Facts } from "./detail-parts";

const PAGE_SIZE = 10;

/** The Vocabulary tab: a learner's own courses, to read and fix. */
export function LearnerVocabularyTab({ userLoginId, name }: Readonly<{ userLoginId: string; name: string }>) {
    const [{ course }, setParams] = useQueryStates(adminUserSearchParams, { history: "push" });
    const open = (courseId: string | null) => void setParams({ course: courseId });

    return course ? (
        <CourseView userLoginId={userLoginId} courseId={course} onBack={() => open(null)} />
    ) : (
        <CourseList userLoginId={userLoginId} name={name} onOpen={open} />
    );
}

function CourseList({
    userLoginId,
    name,
    onOpen,
}: Readonly<{ userLoginId: string; name: string; onOpen: (courseId: string) => void }>) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const searchQuery = useDebounce(search.trim(), 300);
    const { data, isFetching, refetch } = useAdminUserCoursesQuery(userLoginId, {
        page,
        limit: PAGE_SIZE,
        searchQuery: searchQuery || undefined,
    });

    if (!data && isFetching) return <Skeleton aria-busy className="h-64 w-full rounded-2xl" />;
    if (!data) return <ErrorState message="Couldn't load their courses." onRetry={() => void refetch()} />;

    const { stats, courses } = data;
    return (
        <div className="space-y-6">
            <DetailSection title="Their vocabulary" description={`Courses ${name} made for themselves.`}>
                <Facts>
                    <Fact label="Courses">{stats.totalCourses}</Fact>
                    <Fact label="Lessons">{stats.totalLessons}</Fact>
                    <Fact label="Words">{stats.totalWords}</Fact>
                </Facts>
            </DetailSection>

            <DetailSection title="Courses" description="Newest first. Open one to read or fix its lessons and words.">
                <div className="relative mb-4">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="Search course names…"
                        aria-label="Search course names"
                        className="pl-10"
                    />
                </div>
                {courses.items.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title={searchQuery ? "No course matches" : "No courses yet"}
                        description={searchQuery ? "Try another name." : "They haven't made a course."}
                    />
                ) : (
                    <ul className="divide-y divide-border/60">
                        {courses.items.map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    onClick={() => onOpen(item.id)}
                                    className="flex w-full items-center justify-between gap-3 py-3 text-left hover:text-primary"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">{item.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                            {countOf(item.totalLessonsCount ?? 0, "lesson")} · {countOf(item.totalWordsCount ?? 0, "word")}
                                        </span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {courses.totalPages > 1 ? (
                    <div className="mt-4 flex items-center justify-between gap-2 text-sm">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-muted-foreground">
                            Page {courses.currentPage} of {courses.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= courses.totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                ) : null}
            </DetailSection>
        </div>
    );
}

type Editing =
    | { kind: "course" }
    | { kind: "deleteCourse" }
    | { kind: "lesson"; lesson: ILesson }
    | { kind: "deleteLesson"; lesson: ILesson }
    | { kind: "word"; lesson: ILesson; word: IWord }
    | { kind: "deleteWord"; word: IWord }
    | null;

function CourseView({
    userLoginId,
    courseId,
    onBack,
}: Readonly<{ userLoginId: string; courseId: string; onBack: () => void }>) {
    const { data: course, isFetching, error, refetch } = useAdminUserCourseQuery(userLoginId, courseId);
    const [editing, setEditing] = useState<Editing>(null);
    const [filter, setFilter] = useState<WordFilter>("all");
    const updateCourse = useUpdateAdminUserCourseMutation();
    const deleteCourse = useDeleteAdminUserCourseMutation();
    const updateLesson = useUpdateAdminUserLessonMutation();
    const deleteLesson = useDeleteAdminUserLessonMutation();
    const updateWord = useUpdateAdminUserWordMutation();
    const deleteWords = useDeleteAdminUserWordsMutation();

    const back = (
        <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
            <ArrowLeft className="h-4 w-4" />
            All courses
        </button>
    );

    if (!course && isFetching) return <Skeleton aria-busy className="h-64 w-full rounded-2xl" />;
    if (!course) {
        const gone = error instanceof ApiError && (error.status === 404 || error.status === 400);
        return (
            <div className="space-y-4">
                {back}
                {gone ? (
                    <EmptyState icon={BookOpen} title="No such course" description="It may have been deleted." />
                ) : (
                    <ErrorState message="Couldn't load this course." onRetry={() => void refetch()} />
                )}
            </div>
        );
    }

    const ref = { userLoginId, courseId };
    const close = () => setEditing(null);
    const onError = (err: unknown) => toast.error(adminErrorMessages(err)[0]);
    const lessons = course.lessons ?? [];
    const words = lessons.flatMap((lesson) => lesson.words ?? []);
    const incomplete = words.filter((word) => wordGaps(word).length > 0).length;

    return (
        <div className="space-y-6">
            {back}
            <DetailSection title={course.name} description={`${countOf(lessons.length, "lesson")} · ${countOf(words.length, "word")}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        {incomplete === 0
                            ? "Every word has IPA, audio, a meaning and an example."
                            : `${incomplete} of ${countOf(words.length, "word")} ${incomplete === 1 ? "is" : "are"} missing IPA, audio, a meaning or an example.`}
                    </p>
                    <span className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditing({ kind: "course" })}>
                            <Pencil className="h-4 w-4" />
                            Rename
                        </Button>
                        <Button variant="destructive" onClick={() => setEditing({ kind: "deleteCourse" })}>
                            <Trash2 className="h-4 w-4" />
                            Delete course
                        </Button>
                    </span>
                </div>
            </DetailSection>

            {words.length > 0 ? (
                <div className="overflow-x-auto">
                    <div className="w-max">
                        <FilterToggle
                            label="Words"
                            value={filter}
                            options={WORD_FILTERS}
                            onChange={(value) => setFilter(value ?? "all")}
                        />
                    </div>
                </div>
            ) : null}

            {lessons.length === 0 ? (
                <EmptyState icon={BookOpen} title="No lessons yet" description="This course is empty." />
            ) : (
                lessons.map((lesson) => (
                    <LessonSection
                        key={lesson.id}
                        lesson={lesson}
                        onlyIncomplete={filter === "incomplete"}
                        onEdit={() => setEditing({ kind: "lesson", lesson })}
                        onDelete={() => setEditing({ kind: "deleteLesson", lesson })}
                        onEditWord={(word) => setEditing({ kind: "word", lesson, word })}
                        onDeleteWord={(word) => setEditing({ kind: "deleteWord", word })}
                    />
                ))
            )}

            <CourseFormDialog
                isOpen={editing?.kind === "course"}
                onClose={close}
                title="Rename course"
                course={course as ICourse}
                isLoading={updateCourse.isPending}
                onSubmit={(values) =>
                    updateCourse.mutate(
                        { ...ref, course: values },
                        { onSuccess: () => toast.success("Course saved"), onError, onSettled: close },
                    )
                }
            />
            <LessonFormDialog
                isOpen={editing?.kind === "lesson"}
                onClose={close}
                title="Edit lesson"
                lesson={editing?.kind === "lesson" ? editing.lesson : undefined}
                isLoading={updateLesson.isPending}
                onSubmit={(values) =>
                    editing?.kind === "lesson" &&
                    updateLesson.mutate(
                        { ...ref, lessonId: editing.lesson.id, lesson: values },
                        { onSuccess: () => toast.success("Lesson saved"), onError, onSettled: close },
                    )
                }
            />
            {editing?.kind === "word" ? (
                <WordFormDialog
                    isOpen
                    onClose={close}
                    title={`Edit "${editing.word.word}"`}
                    word={editing.word}
                    isLoading={updateWord.isPending}
                    onSubmit={(values) =>
                        updateWord.mutate(
                            { ...ref, lessonId: editing.lesson.id, wordId: editing.word.id, word: values },
                            { onSuccess: () => toast.success("Word saved"), onError, onSettled: close },
                        )
                    }
                />
            ) : null}
            <ConfirmDialog
                isOpen={editing?.kind === "deleteCourse"}
                onClose={close}
                title={`Delete "${course.name}"?`}
                description={`Its ${countOf(lessons.length, "lesson")} and ${countOf(words.length, "word")} go too, with the learner's review progress on them. This can't be undone.`}
                confirmText="Delete course"
                cancelText="Cancel"
                loadingText="Deleting…"
                variant="destructive"
                isLoading={deleteCourse.isPending}
                onConfirm={() =>
                    deleteCourse.mutate(ref, {
                        onSuccess: () => {
                            toast.success("Course deleted");
                            close();
                            onBack();
                        },
                        onError: (err) => {
                            onError(err);
                            close();
                        },
                    })
                }
            />
            <ConfirmDialog
                isOpen={editing?.kind === "deleteLesson"}
                onClose={close}
                title={editing?.kind === "deleteLesson" ? `Delete "${editing.lesson.name}"?` : "Delete lesson?"}
                description={`Its ${countOf(editing?.kind === "deleteLesson" ? (editing.lesson.words?.length ?? 0) : 0, "word")} go too, with the learner's review progress on them. This can't be undone.`}
                confirmText="Delete lesson"
                cancelText="Cancel"
                loadingText="Deleting…"
                variant="destructive"
                isLoading={deleteLesson.isPending}
                onConfirm={() =>
                    editing?.kind === "deleteLesson" &&
                    deleteLesson.mutate(
                        { ...ref, lessonId: editing.lesson.id },
                        { onSuccess: () => toast.success("Lesson deleted"), onError, onSettled: close },
                    )
                }
            />
            <ConfirmDialog
                isOpen={editing?.kind === "deleteWord"}
                onClose={close}
                title={editing?.kind === "deleteWord" ? `Delete "${editing.word.word}"?` : "Delete word?"}
                description="The learner's review progress on it goes too. This can't be undone."
                confirmText="Delete word"
                cancelText="Cancel"
                loadingText="Deleting…"
                variant="destructive"
                isLoading={deleteWords.isPending}
                onConfirm={() =>
                    editing?.kind === "deleteWord" &&
                    deleteWords.mutate(
                        { ...ref, wordIds: [editing.word.id] },
                        { onSuccess: () => toast.success("Word deleted"), onError, onSettled: close },
                    )
                }
            />
        </div>
    );
}
