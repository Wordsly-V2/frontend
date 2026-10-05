"use client";

import { EmptyState, ErrorState, QueryBoundary, Skeleton, SkeletonGrid } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/useDebounce.hook";
import { countOf } from "@/lib/admin/vocabulary";
import { useCopyOfficialCourseMutation, useOfficialCourseQuery, useOfficialCoursesQuery } from "@/queries/official-courses.query";
import type { OfficialCourseCard } from "@/types/official-courses/official-courses.type";
import { BookOpen, Check, GraduationCap, Library, Plus, Search, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 12;

/**
 * `/learn/courses/official`: courses made by the Wordsly team. Adding one
 * copies it into the learner's library, where it is theirs like any other.
 */
export function OfficialCoursesCatalogue() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [previewId, setPreviewId] = useState<string | null>(null);
    const searchQuery = useDebounce(search.trim(), 300);
    const { data, isLoading, isError, isFetching, refetch } = useOfficialCoursesQuery({
        page,
        limit: PAGE_SIZE,
        searchQuery: searchQuery || undefined,
    });
    const copy = useCopyOfficialCourseMutation();

    const add = (course: OfficialCourseCard) =>
        copy.mutate(course.id, {
            onSuccess: (mine) => {
                toast.success(`“${course.name}” is in your library`);
                router.push(`/learn/courses/${mine.id}`);
            },
            onError: () => toast.error("Couldn't add this course. Try again."),
        });
    const preview = data?.items.find((course) => course.id === previewId) ?? null;

    return (
        <>
            <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                    }}
                    placeholder="Search courses…"
                    aria-label="Search Wordsly courses"
                    className="h-10 pl-9"
                />
            </div>

            <QueryBoundary
                isLoading={isLoading && !data}
                isError={isError && !data}
                isEmpty={!!data && data.items.length === 0}
                errorMessage="We couldn't load the courses."
                onRetry={refetch}
                skeleton={<SkeletonGrid className="mt-6" count={6} />}
                empty={
                    searchQuery ? (
                        <EmptyState
                            className="mt-8"
                            icon={SearchX}
                            title="No course matches"
                            description={`Nothing found for “${searchQuery}”. Try another name.`}
                        />
                    ) : (
                        <EmptyState
                            className="mt-8"
                            icon={Library}
                            title="No courses here yet"
                            description="New courses are on the way. You can still make your own in Manage."
                            action={
                                <Button variant="play" asChild>
                                    <Link href="/manage">Go to Manage</Link>
                                </Button>
                            }
                        />
                    )
                }
            >
                {data ? (
                    <>
                        <ul
                            className={`mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 ${isFetching ? "opacity-60" : ""}`}
                        >
                            {data.items.map((course) => (
                                <li key={course.id}>
                                    <CatalogueCard
                                        course={course}
                                        adding={copy.isPending && copy.variables === course.id}
                                        disabled={copy.isPending}
                                        onPreview={() => setPreviewId(course.id)}
                                        onAdd={() => add(course)}
                                    />
                                </li>
                            ))}
                        </ul>
                        <Pagination
                            currentPage={page}
                            totalPages={data.totalPages}
                            onPageChange={setPage}
                            label="Wordsly courses pagination"
                        />
                    </>
                ) : null}
            </QueryBoundary>

            <PreviewDialog
                course={preview}
                onClose={() => setPreviewId(null)}
                adding={copy.isPending}
                onAdd={() => preview && add(preview)}
            />
        </>
    );
}

function CatalogueCard({
    course,
    adding,
    disabled,
    onPreview,
    onAdd,
}: Readonly<{
    course: OfficialCourseCard;
    adding: boolean;
    disabled: boolean;
    onPreview: () => void;
    onAdd: () => void;
}>) {
    return (
        <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <div className="relative h-32 w-full overflow-hidden bg-muted sm:h-36">
                {course.coverImageUrl ? (
                    <Image src={course.coverImageUrl} alt="" fill className="object-cover" />
                ) : (
                    <div className="gradient-brand flex h-full w-full items-center justify-center">
                        <GraduationCap className="h-12 w-12 text-white/80" aria-hidden />
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                <div>
                    <h3 className="line-clamp-2 text-base font-semibold sm:text-lg">{course.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" aria-hidden />
                        {countOf(course.totalLessonsCount, "lesson")} · {countOf(course.totalWordsCount, "word")}
                    </p>
                </div>
                <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    {course.copiedCourseId ? (
                        <Button variant="playOutline" asChild>
                            <Link href={`/learn/courses/${course.copiedCourseId}`}>
                                <Check className="h-4 w-4" aria-hidden />
                                In your library
                            </Link>
                        </Button>
                    ) : (
                        <Button variant="play" onClick={onAdd} disabled={disabled}>
                            <Plus className="h-4 w-4" aria-hidden />
                            {adding ? "Adding…" : "Add to library"}
                        </Button>
                    )}
                    <Button variant="outline" onClick={onPreview} aria-label={`Look inside ${course.name}`}>
                        Look inside
                    </Button>
                </div>
            </div>
        </article>
    );
}

function PreviewDialog({
    course,
    onClose,
    adding,
    onAdd,
}: Readonly<{ course: OfficialCourseCard | null; onClose: () => void; adding: boolean; onAdd: () => void }>) {
    const { data, isError, refetch } = useOfficialCourseQuery(course?.id ?? null);

    return (
        <Dialog open={course !== null} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{course?.name}</DialogTitle>
                    <DialogDescription>
                        {course
                            ? `${countOf(course.totalLessonsCount, "lesson")} · ${countOf(course.totalWordsCount, "word")}`
                            : null}
                    </DialogDescription>
                </DialogHeader>
                <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
                    {data ? (
                        <ol className="space-y-4">
                            {data.lessons.map((lesson) => (
                                <li key={lesson.id}>
                                    <h4 className="text-sm font-semibold">{lesson.name}</h4>
                                    <ul className="mt-1 divide-y divide-border/50 text-sm">
                                        {(lesson.words ?? []).map((word) => (
                                            <li key={word.id} className="flex justify-between gap-3 py-1.5">
                                                <span className="font-medium">{word.word}</span>
                                                <span className="text-right text-muted-foreground">{word.meaning}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ol>
                    ) : isError ? (
                        <ErrorState message="Couldn't load this course." onRetry={() => void refetch()} />
                    ) : (
                        <div className="space-y-2" aria-busy>
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    {course?.copiedCourseId ? (
                        <Button variant="play" asChild>
                            <Link href={`/learn/courses/${course.copiedCourseId}`}>Open my copy</Link>
                        </Button>
                    ) : (
                        <Button variant="play" onClick={onAdd} disabled={adding}>
                            <Plus className="h-4 w-4" aria-hidden />
                            {adding ? "Adding…" : "Add to my library"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
