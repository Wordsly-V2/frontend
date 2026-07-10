"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import LoadingSection from "@/components/common/loading-section/loading-section";
import CoursesHeader from "@/components/features/courses/courses-header";
import CourseFormDialog from "@/components/features/manage/course-form-dialog";
import ManageCourseCard from "@/components/features/manage/manage-course-card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { coursesListSearchParams } from "@/lib/search-params/courses-list";
import {
    useCreateMyCourseMutation,
    useDeleteMyCourseMutation,
    useGetMyCoursesQuery,
    useUpdateMyCourseMutation,
} from "@/queries/courses.query";
import { useGetProgressStatsByCourseIdsQuery } from "@/queries/word-progress.query";
import { ICourse } from "@/types/courses/courses.type";
import { Plus } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ManageCoursesProps {
    onRegisterCreateCourse?: (openCreate: () => void) => void;
}

export default function ManageCourses({ onRegisterCreateCourse }: Readonly<ManageCoursesProps>) {
    const [{ q: searchQuery, page: currentPage }, setSearchParams] = useQueryStates(
        coursesListSearchParams,
        { history: "replace" },
    );
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<ICourse | undefined>();
    const [deleteConfirm, setDeleteConfirm] = useState<ICourse | null>(null);
    const itemsPerPage = 10;

    const { data: paginatedData, isLoading, isError, refetch: loadCourses } = useGetMyCoursesQuery({
        itemsPerPage,
        currentPage,
        orderByField: "name",
        orderByDirection: "asc",
        searchQuery,
    });
    const courseIds = paginatedData?.items.map((course) => course.id) ?? [];
    const { data: statsByCourseId } = useGetProgressStatsByCourseIdsQuery(
        courseIds,
        courseIds.length > 0,
    );
    const mutationCreateMyCourse = useCreateMyCourseMutation();
    const mutationUpdateMyCourse = useUpdateMyCourseMutation();
    const mutationDeleteMyCourse = useDeleteMyCourseMutation();

    const openCreateDialog = useCallback(() => {
        setEditingCourse(undefined);
        setIsFormOpen(true);
    }, []);

    useEffect(() => {
        onRegisterCreateCourse?.(openCreateDialog);
    }, [onRegisterCreateCourse, openCreateDialog]);

    const handleCreateMyCourse = (courseData: Pick<ICourse, "name" | "coverImageUrl">) => {
        mutationCreateMyCourse.mutate(courseData, {
            onSuccess: () => {
                loadCourses();
                setSearchParams({ page: 1 });
                setIsFormOpen(false);
                toast.success("Course created successfully");
            },
            onError: (err) => {
                toast.error("Failed to create course: " + err.message);
            },
        });
    };

    const handleUpdateMyCourse = (
        courseId: string,
        courseData: Pick<ICourse, "name" | "coverImageUrl">,
    ) => {
        mutationUpdateMyCourse.mutate(
            { courseId, courseData },
            {
                onSuccess: () => {
                    loadCourses();
                    setIsFormOpen(false);
                    toast.success("Course updated successfully");
                    setEditingCourse(undefined);
                },
                onError: (err) => {
                    toast.error("Failed to update course: " + err.message);
                },
            },
        );
    };

    const handleCreateUpdateMyCourse = (courseData: Pick<ICourse, "name" | "coverImageUrl">) => {
        if (editingCourse) {
            handleUpdateMyCourse(editingCourse.id, courseData);
        } else {
            handleCreateMyCourse(courseData);
        }
    };

    const handleDeleteMyCourse = (courseId: string) => {
        return mutationDeleteMyCourse.mutate(courseId, {
            onSuccess: () => {
                loadCourses();
                setSearchParams({ page: 1 });
                setDeleteConfirm(null);
                toast.success("Course deleted successfully");
            },
            onError: (err) => {
                toast.error("Failed to delete course: " + err.message);
            },
        });
    };

    const handleSearch = (query: string) => {
        setSearchParams({ q: query || null, page: 1 });
    };

    const handlePageChange = (page: number) => {
        setSearchParams({ page });
    };

    return (
        <>
            <section id="course-library" aria-labelledby="manage-course-library-heading" className="scroll-mt-24">
                <CoursesHeader
                    searchQuery={searchQuery}
                    totalCourses={paginatedData?.totalItems ?? 0}
                    onSearch={handleSearch}
                    onCreateCourse={openCreateDialog}
                    sectionLabel="Content"
                    title="Course library"
                    searchPlaceholder="Search courses to edit…"
                />

                {isLoading || isError || !paginatedData ? (
                    <LoadingSection
                        isLoading={isLoading}
                        error={isError ? "Error loading courses" : null}
                        refetch={loadCourses}
                        fullPage={false}
                    />
                ) : paginatedData.items.length === 0 ? (
                    <div className="mt-6 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-14 text-center sm:mt-8 sm:py-16">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3
                            id="manage-course-library-heading"
                            className="mb-2 text-lg font-semibold"
                        >
                            {searchQuery ? "No courses match your search" : "No courses yet"}
                        </h3>
                        <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground sm:text-base">
                            {searchQuery
                                ? "Try a different name or clear the search."
                                : "Create your first course, add lessons and words, then study it in Learn."}
                        </p>
                        {!searchQuery ? (
                            <Button onClick={openCreateDialog} className="rounded-xl gap-2">
                                <Plus className="h-4 w-4" />
                                Create your first course
                            </Button>
                        ) : null}
                    </div>
                ) : (
                    <>
                        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                            {paginatedData.items.map((course) => (
                                <ManageCourseCard
                                    key={course.id}
                                    course={course}
                                    wordProgressStats={statsByCourseId?.[course.id]}
                                    onEdit={(c) => {
                                        setEditingCourse(c);
                                        setIsFormOpen(true);
                                    }}
                                    onDelete={setDeleteConfirm}
                                />
                            ))}
                        </div>

                        <Pagination
                            currentPage={paginatedData.currentPage}
                            totalPages={paginatedData.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </section>

            <CourseFormDialog
                isLoading={mutationCreateMyCourse.isPending || mutationUpdateMyCourse.isPending}
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingCourse(undefined);
                }}
                onSubmit={handleCreateUpdateMyCourse}
                course={editingCourse}
                title={editingCourse ? "Edit Course" : "Create New Course"}
            />

            {deleteConfirm ? (
                <ConfirmDialog
                    isOpen={!!deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    onConfirm={() => handleDeleteMyCourse(deleteConfirm.id)}
                    title="Delete Course"
                    description={`Are you sure you want to delete "${deleteConfirm.name}"? This will also delete all lessons and words in this course. This action cannot be undone.`}
                    confirmText="Delete Course"
                    variant="destructive"
                    isLoading={mutationDeleteMyCourse.isPending}
                />
            ) : null}
        </>
    );
}
