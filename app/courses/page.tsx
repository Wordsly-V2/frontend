"use client";

import { useState } from "react";
import CourseCard from "@/components/common/course-card/course-card";
import CourseDialog, { CoursePayload } from "@/components/common/course-dialog/course-dialog";
import { Button } from "@/components/ui/button";
import { ICourse } from "@/types/courses/courses.type";
import { createMyCourses, getMyCourses } from "@/apis/courses.api";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NoCourses } from "@/components/common/no-courses/no-courses";

export default function CoursesPage() {
    const { data: courses, isLoading, error, refetch } = useQuery({
        queryKey: ['courses'],
        queryFn: () => getMyCourses(),
    });

    const [selectedCourse, setSelectedCourse] = useState<CoursePayload | undefined>(undefined);
    const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <LoadingSpinner size="lg" label="Đang tải khóa học…" />
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 gap-4">
                <div>Error: {error.message}</div>
                <Button onClick={() => {
                    refetch();
                }}>Thử lại</Button>
            </main>
        );
    }

    return (
        <>
            {
                !courses?.length && (
                    <NoCourses onCreateCourse={() => {
                        console.log("onCreateCourse", isCourseDialogOpen);
                        setIsCourseDialogOpen(true)
                    }} />
                )
            }
            {
                courses?.length && (
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
                                    Khóa học của tôi
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Chọn khóa học để bắt đầu học từ vựng.
                                </p>
                            </div>
                            <Button onClick={() => setIsCourseDialogOpen(true)}>Tạo khóa học</Button>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {courses?.map((course: ICourse) => (
                                <CourseCard key={course.id} course={course} onCourseClick={() => {
                                    setSelectedCourse(course);
                                    setIsCourseDialogOpen(true);
                                }} />
                            ))}
                        </div>
                    </div>
                )
            }

            <CourseDialog
                isOpen={isCourseDialogOpen}
                onSubmit={(course) => {
                    createMyCourses({ courses: [{ name: course.title, coverImageUrl: course.cover }] }).then(() => {
                        refetch();
                        setIsCourseDialogOpen(false);
                    }).catch((error) => {
                        console.error("Error creating course", error);
                    });
                }}
                onClose={() => setIsCourseDialogOpen(false)}
                mode="create"
                dialogTitle={selectedCourse ? "Chỉnh sửa khóa học" : "Tạo khóa học"}
                course={selectedCourse}
            />
        </>

    );
}