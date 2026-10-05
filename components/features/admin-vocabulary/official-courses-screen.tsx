"use client";

import { EmptyState, ErrorState, Skeleton } from "@/components/common/states";
import { FilterToggle } from "@/components/features/admin/filter-toggle";
import CourseFormDialog from "@/components/features/manage/course-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce.hook";
import { officialStatus, STATUS_FILTERS, STATUS_LABELS } from "@/lib/admin/official-courses";
import { formatDate } from "@/lib/admin/users";
import { countOf } from "@/lib/admin/vocabulary";
import { adminErrorMessages } from "@/lib/admin-path/errors";
import { useAdminOfficialCoursesQuery, useCreateOfficialCourseMutation } from "@/queries/admin-official-courses.query";
import type { OfficialCourseStatus } from "@/types/official-courses/official-courses.type";
import { ChevronLeft, ChevronRight, Library, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

/** `/admin/vocabulary`: official courses, drafts and published. */
export function OfficialCoursesScreen() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<OfficialCourseStatus | null>(null);
    const [page, setPage] = useState(1);
    const [creating, setCreating] = useState(false);
    const searchQuery = useDebounce(search.trim(), 300);
    const { data, isFetching, refetch } = useAdminOfficialCoursesQuery({
        page,
        limit: PAGE_SIZE,
        searchQuery: searchQuery || undefined,
        status: status ?? undefined,
    });
    const create = useCreateOfficialCourseMutation();
    const filtered = Boolean(searchQuery || status);

    return (
        <div className="space-y-5">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div className="max-w-xl">
                    <h1 className="text-2xl font-bold">Official courses</h1>
                    <p className="text-sm text-muted-foreground">
                        Vocabulary courses for every learner. Once published, learners add a copy to their library; later
                        edits don&apos;t reach copies they already have.
                    </p>
                </div>
                <Button onClick={() => setCreating(true)}>
                    <Plus className="h-4 w-4" />
                    New course
                </Button>
            </header>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="Search course names…"
                        aria-label="Search official courses"
                        className="pl-9"
                    />
                </div>
                <div className="overflow-x-auto">
                    <div className="w-max">
                        <FilterToggle
                            label="Status"
                            value={status}
                            options={STATUS_FILTERS}
                            onChange={(value) => {
                                setStatus(value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {!data && isFetching ? (
                <Skeleton aria-busy className="h-64 w-full rounded-2xl" />
            ) : !data ? (
                <ErrorState message="Couldn't load official courses." onRetry={() => void refetch()} />
            ) : data.items.length === 0 ? (
                <EmptyState
                    icon={Library}
                    title={filtered ? "No course matches" : "No official courses yet"}
                    description={filtered ? "Try another name or status." : "Make one, add lessons and words, then publish it."}
                    action={
                        filtered ? undefined : (
                            <Button onClick={() => setCreating(true)}>
                                <Plus className="h-4 w-4" />
                                New course
                            </Button>
                        )
                    }
                />
            ) : (
                <section className={`rounded-2xl border border-border/80 bg-card ${isFetching ? "opacity-70" : ""}`}>
                    <ul className="divide-y divide-border/60">
                        {data.items.map((course) => {
                            const courseStatus = officialStatus(course);
                            return (
                                <li key={course.id}>
                                    <Link
                                        href={`/admin/vocabulary/courses/${course.id}`}
                                        className="flex items-center justify-between gap-3 px-5 py-4 hover:text-primary"
                                    >
                                        <span className="min-w-0 space-y-1">
                                            <span className="flex flex-wrap items-center gap-2">
                                                <span className="truncate font-medium">{course.name}</span>
                                                <Badge variant={courseStatus === "published" ? "success" : "muted"}>
                                                    {STATUS_LABELS[courseStatus]}
                                                </Badge>
                                            </span>
                                            <span className="block text-sm text-muted-foreground">
                                                {countOf(course.totalLessonsCount, "lesson")} ·{" "}
                                                {countOf(course.totalWordsCount, "word")}
                                                {course.publishedAt
                                                    ? ` · published ${formatDate(course.publishedAt)}`
                                                    : ` · made ${formatDate(course.createdAt)}`}
                                            </span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {data && data.totalPages > 1 ? (
                <div className="flex items-center justify-between gap-2 text-sm">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-muted-foreground">
                        Page {data.currentPage} of {data.totalPages}
                    </span>
                    <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            ) : null}

            <CourseFormDialog
                isOpen={creating}
                onClose={() => setCreating(false)}
                title="New official course"
                isLoading={create.isPending}
                onSubmit={(values) =>
                    create.mutate(values, {
                        onSuccess: (course) => {
                            toast.success("Course created as a draft");
                            setCreating(false);
                            router.push(`/admin/vocabulary/courses/${course.id}`);
                        },
                        onError: (err) => toast.error(adminErrorMessages(err)[0]),
                    })
                }
            />
        </div>
    );
}
