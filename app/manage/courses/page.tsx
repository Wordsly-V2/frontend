"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Edit, Trash2, Eye } from "lucide-react";
import { getAllCourses, createCourse, updateCourse, deleteCourse } from "@/lib/data-store";
import { ICourse } from "@/types/courses/courses.type";
import DataTable from "@/components/common/data-table/data-table";
import CourseFormDialog from "@/components/features/manage/course-form-dialog";
import ConfirmDialog from "@/components/common/confirm-dialog/confirm-dialog";
import Image from "next/image";

export default function ManageCoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<ICourse[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<ICourse | undefined>();
    const [deleteConfirm, setDeleteConfirm] = useState<ICourse | null>(null);

    const loadCourses = () => {
        setCourses(getAllCourses());
    };

    useEffect(() => {
        loadCourses();
    }, []);

    const handleCreate = (courseData: Omit<ICourse, 'id' | 'createdAt' | 'updatedAt' | 'lessons'>) => {
        createCourse(courseData);
        loadCourses();
        setIsFormOpen(false);
    };

    const handleUpdate = (courseData: Omit<ICourse, 'id' | 'createdAt' | 'updatedAt' | 'lessons'>) => {
        if (editingCourse) {
            updateCourse(editingCourse.id, courseData);
            loadCourses();
            setEditingCourse(undefined);
            setIsFormOpen(false);
        }
    };

    const handleDelete = (course: ICourse) => {
        deleteCourse(course.id);
        loadCourses();
        setDeleteConfirm(null);
    };

    const openEditDialog = (course: ICourse) => {
        setEditingCourse(course);
        setIsFormOpen(true);
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
                            router.push(`/learn/courses/${course.id}`);
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
                            router.push(`/manage/courses/${course.id}`);
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
                            {courses.length} {courses.length === 1 ? 'course' : 'courses'} in your library
                        </p>
                    </div>
                    <Button onClick={openCreateDialog} size="lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Course
                    </Button>
                </div>

                <DataTable
                    data={courses}
                    columns={columns}
                    emptyMessage="No courses yet. Create your first course to get started!"
                />
            </div>

            <CourseFormDialog
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingCourse(undefined);
                }}
                onSubmit={editingCourse ? handleUpdate : handleCreate}
                course={editingCourse}
                title={editingCourse ? 'Edit Course' : 'Create New Course'}
            />

            {deleteConfirm && (
                <ConfirmDialog
                    isOpen={!!deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    onConfirm={() => handleDelete(deleteConfirm)}
                    title="Delete Course"
                    description={`Are you sure you want to delete "${deleteConfirm.name}"? This will also delete all lessons and words in this course. This action cannot be undone.`}
                    confirmText="Delete Course"
                    variant="destructive"
                />
            )}
        </main>
    );
}
