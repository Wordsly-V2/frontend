"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import { SelectedWordsBar } from "@/components/features/admin-dictionary-sync/selected-words-bar";
import { SyncWithLangeekButton } from "@/components/features/admin-dictionary-sync/start-sync-dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { FilterToggle } from "@/components/features/admin/filter-toggle";
import { DetailSection, Fact, Facts } from "@/components/features/admin-users/detail-parts";
import CourseFormDialog from "@/components/features/manage/course-form-dialog";
import LessonFormDialog from "@/components/features/manage/lesson-form-dialog";
import WordFormDialog from "@/components/features/manage/word-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { courseWordCount, officialStatus, publishBlocker, STATUS_LABELS } from "@/lib/admin/official-courses";
import { formatDate } from "@/lib/admin/users";
import { toggleId } from "@/lib/admin/dictionary-sync";
import { countOf, wordGaps } from "@/lib/admin/vocabulary";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { ApiError } from "@/lib/api-error";
import {
    useAdminOfficialCourseQuery,
    useCreateOfficialLessonMutation,
    useCreateOfficialWordMutation,
    useDeleteOfficialCourseMutation,
    useDeleteOfficialLessonMutation,
    useDeleteOfficialWordsMutation,
    useSetOfficialCoursePublishedMutation,
    useUpdateOfficialCourseMutation,
    useUpdateOfficialLessonMutation,
    useUpdateOfficialWordMutation,
} from "@/queries/admin-official-courses.query";
import type { ICourse, ILesson, IWord } from "@/types/courses/courses.type";
import { ArrowLeft, BookOpen, EyeOff, Pencil, Plus, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { LessonSection, WORD_FILTERS, type WordFilter } from "./course-content";

type Editing =
    | { kind: "course" }
    | { kind: "deleteCourse" }
    | { kind: "publish" }
    | { kind: "unpublish" }
    | { kind: "newLesson" }
    | { kind: "lesson"; lesson: ILesson }
    | { kind: "deleteLesson"; lesson: ILesson }
    | { kind: "newWord"; lesson: ILesson }
    | { kind: "word"; lesson: ILesson; word: IWord }
    | { kind: "deleteWord"; word: IWord }
    | null;

const back = (
    <Link
        href="/admin/vocabulary"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
        <ArrowLeft className="h-4 w-4" />
        All official courses
    </Link>
);

/** `/admin/vocabulary/courses/[id]`: one official course, to build, fix and publish. */
export function OfficialCourseEditor({ courseId }: Readonly<{ courseId: string }>) {
    const router = useRouter();
    const { data: course, isFetching, error, refetch } = useAdminOfficialCourseQuery(courseId);
    const [editing, setEditing] = useState<Editing>(null);
    const [filter, setFilter] = useState<WordFilter>("all");
    const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
    const updateCourse = useUpdateOfficialCourseMutation();
    const deleteCourse = useDeleteOfficialCourseMutation();
    const setPublished = useSetOfficialCoursePublishedMutation();
    const createLesson = useCreateOfficialLessonMutation();
    const updateLesson = useUpdateOfficialLessonMutation();
    const deleteLesson = useDeleteOfficialLessonMutation();
    const createWord = useCreateOfficialWordMutation();
    const updateWord = useUpdateOfficialWordMutation();
    const deleteWords = useDeleteOfficialWordsMutation();

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

    const close = () => setEditing(null);
    const onError = (err: unknown) => toast.error(adminErrorMessages(err)[0]);
    const status = officialStatus(course);
    const lessons = course.lessons;
    const words = courseWordCount(course);
    const incomplete = lessons.flatMap((lesson) => lesson.words ?? []).filter((word) => wordGaps(word).length > 0).length;
    const blocker = publishBlocker(course);

    return (
        <div className="space-y-6">
            {back}

            <header className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="min-w-0 break-words text-2xl font-bold">{course.name}</h1>
                    <Badge variant={status === "published" ? "success" : "muted"}>{STATUS_LABELS[status]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    {status === "published"
                        ? "Learners can see it and add a copy to their library. Your edits show up for new copies only."
                        : "A draft: learners can't see it yet."}
                </p>
            </header>

            <DetailSection title="Course">
                <Facts>
                    <Fact label="Lessons">{lessons.length}</Fact>
                    <Fact label="Words">{words}</Fact>
                    <Fact label="Missing something">{incomplete === 0 ? "None" : countOf(incomplete, "word")}</Fact>
                    <Fact label="Made">{course.createdAt ? formatDate(course.createdAt) : "–"}</Fact>
                    <Fact label="Published">{course.publishedAt ? formatDate(course.publishedAt) : "Not yet"}</Fact>
                </Facts>
                <div className="mt-5 flex flex-wrap gap-2">
                    {status === "draft" ? (
                        <Button
                            onClick={() => setEditing({ kind: "publish" })}
                            disabled={blocker !== null}
                            title={blocker ?? undefined}
                        >
                            <Send className="h-4 w-4" />
                            Publish
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => setEditing({ kind: "unpublish" })}>
                            <EyeOff className="h-4 w-4" />
                            Unpublish
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setEditing({ kind: "course" })}>
                        <Pencil className="h-4 w-4" />
                        Rename
                    </Button>
                    {words > 0 ? (
                        <SyncWithLangeekButton preset={{ scope: "course", targetId: courseId, label: course.name }} />
                    ) : null}
                    <Button variant="destructive" onClick={() => setEditing({ kind: "deleteCourse" })}>
                        <Trash2 className="h-4 w-4" />
                        Delete course
                    </Button>
                </div>
                {status === "draft" && blocker ? <p className="mt-2 text-sm text-muted-foreground">{blocker}</p> : null}
            </DetailSection>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Lessons</h2>
                <span className="flex flex-wrap items-center gap-2">
                    {words > 0 ? (
                        <span className="overflow-x-auto">
                            <span className="block w-max">
                                <FilterToggle
                                    label="Words"
                                    value={filter}
                                    options={WORD_FILTERS}
                                    onChange={(value) => setFilter(value ?? "all")}
                                />
                            </span>
                        </span>
                    ) : null}
                    <Button variant="outline" onClick={() => setEditing({ kind: "newLesson" })}>
                        <Plus className="h-4 w-4" />
                        Add lesson
                    </Button>
                </span>
            </div>

            <SelectedWordsBar wordIds={[...selected]} onClear={() => setSelected(new Set())} />

            {lessons.length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title="No lessons yet"
                    description="Add a lesson, then put words in it."
                    action={
                        <Button onClick={() => setEditing({ kind: "newLesson" })}>
                            <Plus className="h-4 w-4" />
                            Add lesson
                        </Button>
                    }
                />
            ) : (
                lessons.map((lesson) => (
                    <LessonSection
                        key={lesson.id}
                        lesson={lesson}
                        onlyIncomplete={filter === "incomplete"}
                        onAddWord={() => setEditing({ kind: "newWord", lesson })}
                        onEdit={() => setEditing({ kind: "lesson", lesson })}
                        onDelete={() => setEditing({ kind: "deleteLesson", lesson })}
                        onEditWord={(word) => setEditing({ kind: "word", lesson, word })}
                        onDeleteWord={(word) => setEditing({ kind: "deleteWord", word })}
                        selected={selected}
                        onToggleWord={(word) => setSelected((ids) => toggleId(ids, word.id))}
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
                        { courseId, course: values },
                        { onSuccess: () => toast.success("Course saved"), onError, onSettled: close },
                    )
                }
            />
            <LessonFormDialog
                isOpen={editing?.kind === "lesson" || editing?.kind === "newLesson"}
                onClose={close}
                title={editing?.kind === "lesson" ? "Edit lesson" : "New lesson"}
                lesson={editing?.kind === "lesson" ? editing.lesson : undefined}
                isLoading={updateLesson.isPending || createLesson.isPending}
                onSubmit={(values) => {
                    if (editing?.kind === "lesson") {
                        updateLesson.mutate(
                            { courseId, lessonId: editing.lesson.id, lesson: values },
                            { onSuccess: () => toast.success("Lesson saved"), onError, onSettled: close },
                        );
                    } else {
                        createLesson.mutate(
                            { courseId, lesson: values },
                            { onSuccess: () => toast.success("Lesson added"), onError, onSettled: close },
                        );
                    }
                }}
            />
            {editing?.kind === "word" || editing?.kind === "newWord" ? (
                <WordFormDialog
                    isOpen
                    onClose={close}
                    title={editing.kind === "word" ? `Edit "${editing.word.word}"` : `New word in ${editing.lesson.name}`}
                    word={editing.kind === "word" ? editing.word : undefined}
                    isLoading={updateWord.isPending || createWord.isPending}
                    onSubmit={(values) => {
                        if (editing.kind === "word") {
                            updateWord.mutate(
                                { courseId, lessonId: editing.lesson.id, wordId: editing.word.id, word: values },
                                { onSuccess: () => toast.success("Word saved"), onError, onSettled: close },
                            );
                        } else {
                            createWord.mutate(
                                { courseId, lessonId: editing.lesson.id, word: values },
                                { onSuccess: () => toast.success("Word added"), onError, onSettled: close },
                            );
                        }
                    }}
                />
            ) : null}
            <ConfirmDialog
                isOpen={editing?.kind === "publish"}
                onClose={close}
                title={`Publish "${course.name}"?`}
                description={`Every learner will see it and can add a copy to their library (${countOf(lessons.length, "lesson")}, ${countOf(words, "word")}).`}
                confirmText="Publish"
                cancelText="Cancel"
                loadingText="Publishing…"
                isLoading={setPublished.isPending}
                onConfirm={() =>
                    setPublished.mutate(
                        { courseId, published: true },
                        { onSuccess: () => toast.success("Published"), onError, onSettled: close },
                    )
                }
            />
            <ConfirmDialog
                isOpen={editing?.kind === "unpublish"}
                onClose={close}
                title={`Unpublish "${course.name}"?`}
                description="Learners won't find it any more. Copies they already added stay in their library."
                confirmText="Unpublish"
                cancelText="Cancel"
                loadingText="Unpublishing…"
                isLoading={setPublished.isPending}
                onConfirm={() =>
                    setPublished.mutate(
                        { courseId, published: false },
                        { onSuccess: () => toast.success("Back to draft"), onError, onSettled: close },
                    )
                }
            />
            <ConfirmDialog
                isOpen={editing?.kind === "deleteCourse"}
                onClose={close}
                title={`Delete "${course.name}"?`}
                description={`Its ${countOf(lessons.length, "lesson")} and ${countOf(words, "word")} go too. Copies learners already added stay in their library. This can't be undone.`}
                confirmText="Delete course"
                cancelText="Cancel"
                loadingText="Deleting…"
                variant="destructive"
                isLoading={deleteCourse.isPending}
                onConfirm={() =>
                    deleteCourse.mutate(
                        { courseId },
                        {
                            onSuccess: () => {
                                toast.success("Course deleted");
                                close();
                                router.push("/admin/vocabulary");
                            },
                            onError: (err) => {
                                onError(err);
                                close();
                            },
                        },
                    )
                }
            />
            <ConfirmDialog
                isOpen={editing?.kind === "deleteLesson"}
                onClose={close}
                title={editing?.kind === "deleteLesson" ? `Delete "${editing.lesson.name}"?` : "Delete lesson?"}
                description={`Its ${countOf(editing?.kind === "deleteLesson" ? (editing.lesson.words?.length ?? 0) : 0, "word")} go too. Learners' copies keep theirs. This can't be undone.`}
                confirmText="Delete lesson"
                cancelText="Cancel"
                loadingText="Deleting…"
                variant="destructive"
                isLoading={deleteLesson.isPending}
                onConfirm={() =>
                    editing?.kind === "deleteLesson" &&
                    deleteLesson.mutate(
                        { courseId, lessonId: editing.lesson.id },
                        { onSuccess: () => toast.success("Lesson deleted"), onError, onSettled: close },
                    )
                }
            />
            <ConfirmDialog
                isOpen={editing?.kind === "deleteWord"}
                onClose={close}
                title={editing?.kind === "deleteWord" ? `Delete "${editing.word.word}"?` : "Delete word?"}
                description="Learners' copies keep it. This can't be undone."
                confirmText="Delete word"
                cancelText="Cancel"
                loadingText="Deleting…"
                variant="destructive"
                isLoading={deleteWords.isPending}
                onConfirm={() =>
                    editing?.kind === "deleteWord" &&
                    deleteWords.mutate(
                        { courseId, wordIds: [editing.word.id] },
                        { onSuccess: () => toast.success("Word deleted"), onError, onSettled: close },
                    )
                }
            />
        </div>
    );
}
