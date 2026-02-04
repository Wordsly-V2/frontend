"use client";

import { createMyCourse, deleteMyCourse, updateMyCourse } from "@/apis/courses.api";
import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import DataTable from "@/components/common/data-table/data-table";
import LoadingSection from "@/components/common/loading-section/loading-section";
import CourseFormDialog from "@/components/features/manage/course-form-dialog";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useGetMyCoursesQuery } from "@/queries/courses.query";
import { ICourse } from "@/types/courses/courses.type";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Edit, Eye, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ManageCoursesPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<ICourse | undefined>();
    const [deleteConfirm, setDeleteConfirm] = useState<ICourse | null>(null);
    const itemsPerPage = 10;

    const { data: paginatedData, isLoading, isError, refetch: loadCourses } = useGetMyCoursesQuery(itemsPerPage, currentPage, );

    const mutationCourse = useMutation({
        mutationFn: (courseData: Pick<ICourse, 'name' | 'coverImageUrl'>) => {
            if (editingCourse) {
                return updateMyCourse(editingCourse.id, courseData);
            } else {
                return createMyCourse(courseData);
            }
        },
        onSuccess: () => {
            loadCourses();
            setCurrentPage(1);
            setIsFormOpen(false);
            toast.success(editingCourse ? 'Course updated successfully' : 'Course created successfully');
            setEditingCourse(undefined);
        },
        onError: (err) => {
            toast.error('Failed to ' + (editingCourse ? 'update' : 'create') + ' course: ' + err.message);
        },
    });

    const mutationDeleteCourse = useMutation({
        mutationFn: (courseId: string) => deleteMyCourse(courseId),
        onSuccess: () => {
            loadCourses();
            toast.success('Course deleted successfully');
            setDeleteConfirm(null);
        },
        onError: (err) => {
            toast.error('Failed to delete course: ' + err.message);
        },
    });

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const openCreateDialog = () => {
        setEditingCourse(undefined);
        setIsFormOpen(true);
    };

    const columns = [
        {
            key: 'coverImageUrl' as keyof ICourse,
            label: 'Image',
            render: (course: ICourse) => (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                    {course.coverImageUrl ? (
                        <Image
                            src={course.coverImageUrl}
                            alt={course.name}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="w-full h-full gradient-brand flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                                {course.name.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'name' as keyof ICourse,
            label: 'Course Name',
            render: (course: ICourse) => (
                <div>
                    <p className="font-semibold">{course.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {course.lessons?.length || 0} lessons • {course.lessons?.reduce((sum, l) => sum + (l.words?.length || 0), 0) || 0} words
                    </p>
                </div>
            ),
        },
        {
            key: 'actions' as keyof ICourse,
            label: 'Actions',
            render: (course: ICourse) => (
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/manage/courses/${course.id}`);
                        }}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingCourse(course);
                            setIsFormOpen(true);
                        }}
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(course);
                        }}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    if (isLoading || isError || !paginatedData) {
        return <LoadingSection isLoading={isLoading} error={isError ? 'Error loading courses' : null} refetch={loadCourses} />;
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/manage')}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </Button>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Manage Courses</h1>
                        <p className="text-muted-foreground">
                            {paginatedData.totalItems} {paginatedData.totalItems === 1 ? 'course' : 'courses'} in your library
                        </p>
                    </div>
                    <Button onClick={openCreateDialog} size="lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Course
                    </Button>
                </div>

                <DataTable
                    data={paginatedData.items}
                    columns={columns}
                    emptyMessage="No courses yet. Create your first course to get started!"
                />

                <Pagination
                    currentPage={paginatedData.currentPage}
                    totalPages={paginatedData.totalPages}
                    onPageChange={handlePageChange}
                />
            </div>

            <CourseFormDialog
                isLoading={mutationCourse.isPending}
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingCourse(undefined);
                }}
                onSubmit={mutationCourse.mutate}
                course={editingCourse}
                title={editingCourse ? 'Edit Course' : 'Create New Course'}
            />

            {deleteConfirm && (
                <ConfirmDialog
                    isOpen={!!deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    onConfirm={() => mutationDeleteCourse.mutate(deleteConfirm.id)}
                    title="Delete Course"
                    description={`Are you sure you want to delete "${deleteConfirm.name}"? This will also delete all lessons and words in this course. This action cannot be undone.`}
                    confirmText="Delete Course"
                    variant="destructive"
                    isLoading={mutationDeleteCourse.isPending}
                />
            )}
        </main>
    );
}