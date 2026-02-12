"use client";

import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import DataTable from "@/components/common/data-table/data-table";
import LoadingSection from "@/components/common/loading-section/loading-section";
import { WordProgressStatsInline } from "@/components/common/word-progress-stats";
import CourseFormDialog from "@/components/features/manage/course-form-dialog";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useCourses } from "@/hooks/useCourses.hook";
import { useGetMyCoursesQuery } from "@/queries/courses.query";
import { ICourse } from "@/types/courses/courses.type";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ManageCourses() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<ICourse | undefined>();
    const [deleteConfirm, setDeleteConfirm] = useState<ICourse | null>(null);
    const itemsPerPage = 10;

    const { data: paginatedData, isLoading, isError, refetch: loadCourses } = useGetMyCoursesQuery(itemsPerPage, currentPage, );
    const { mutationCreateMyCourse, mutationUpdateMyCourse, mutationDeleteMyCourse } = useCourses();

    const handleCreateMyCourse = (courseData: Pick<ICourse, 'name' | 'coverImageUrl'>) => {
        mutationCreateMyCourse.mutate(courseData, {
            onSuccess: () => {
                loadCourses();
                setCurrentPage(1);
                setIsFormOpen(false);
                toast.success('Course created successfully');
            },
            onError: (err) => {
                toast.error('Failed to create course: ' + err.message);
            },
        });
    }

    const handleUpdateMyCourse = (courseId: string, courseData: Pick<ICourse, 'name' | 'coverImageUrl'>) => {
        mutationUpdateMyCourse.mutate({ courseId, courseData }, {
            onSuccess: () => {
                loadCourses();
                setCurrentPage(1);
                setIsFormOpen(false);
                toast.success('Course updated successfully');
                setEditingCourse(undefined);
            },
            onError: (err) => {
                toast.error('Failed to update course: ' + err.message);
            },
        });
    }

    const handleCreateUpdateMyCourse = (courseData: Pick<ICourse, 'name' | 'coverImageUrl'>) => {
        if (editingCourse) {
            handleUpdateMyCourse(editingCourse.id, courseData);
        } else {
            handleCreateMyCourse(courseData);
        }
    }

    const handleDeleteMyCourse = (courseId: string) => {
        return mutationDeleteMyCourse.mutate(courseId, {
            onSuccess: () => {
                loadCourses();
                setCurrentPage(1);
                setIsFormOpen(false);
                toast.success('Course deleted successfully');
                setDeleteConfirm(null);
            },
            onError: (err) => {
                toast.error('Failed to delete course: ' + err.message);
            },
        });
    }

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
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted">
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
                    <p className="font-semibold text-sm sm:text-base">{course.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {course.totalLessonsCount || 0} lessons • {course.totalWordsCount || 0} words
                    </p>
                </div>
            ),
        },
        {
            key: 'wordProgressStats' as keyof ICourse,
            label: 'Progress',
            render: (course: ICourse) => (
                <div className="min-w-0 max-w-[200px]">
                    {course.wordProgressStats ? (
                        <WordProgressStatsInline
                            stats={course.wordProgressStats}
                            totalWords={course.totalWordsCount}
                        />
                    ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </div>
            ),
        },
        {
            key: 'actions' as keyof ICourse,
            label: 'Actions',
            render: (course: ICourse) => (
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/manage/courses/${course.id}`);
                        }}
                        className="text-xs sm:text-sm h-8"
                    >
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingCourse(course);
                            setIsFormOpen(true);
                        }}
                        className="text-xs sm:text-sm h-8"
                    >
                        <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(course);
                        }}
                        className="text-destructive hover:text-destructive text-xs sm:text-sm h-8 px-2 sm:px-3"
                    >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    if (isLoading || isError || !paginatedData) {
        return <LoadingSection isLoading={isLoading} error={isError ? 'Error loading courses' : null} refetch={loadCourses} />;
    }

    return (
        <main className="min-h-dvh bg-background">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">Manage Courses</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            {paginatedData.totalItems} {paginatedData.totalItems === 1 ? 'course' : 'courses'} in your library
                        </p>
                    </div>
                    <Button onClick={openCreateDialog} size="default" className="w-full sm:w-auto">
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
                isLoading={mutationCreateMyCourse.isPending || mutationUpdateMyCourse.isPending}
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingCourse(undefined);
                }}
                onSubmit={handleCreateUpdateMyCourse}
                course={editingCourse}
                title={editingCourse ? 'Edit Course' : 'Create New Course'}
            />

            {deleteConfirm && (
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
            )}
        </main>
    );
}