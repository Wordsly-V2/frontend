"use client";

import { useState } from "react";
import CourseCard from "@/components/common/course-card/course-card";
import CourseDialog, { CoursePayload } from "@/components/common/course-dialog/course-dialog";
import { Button } from "@/components/ui/button";

export default function CoursesPage() {
    const initialCourses = [
        {
            id: "toeic-essentials",
            title: "TOEIC Essentials",
            cover:
                "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1600&auto=format&fit=crop",
            vocabCount: 560,
            partsCount: 8,
        },
        {
            id: "daily-english",
            title: "English giao tiếp hằng ngày",
            cover:
                "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1600&auto=format&fit=crop",
            vocabCount: 420,
            partsCount: 6,
        },
        {
            id: "business-vocab",
            title: "Business Vocabulary",
            cover:
                "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1600&auto=format&fit=crop",
            vocabCount: 380,
            partsCount: 5,
        },
        {
            id: "travel-english",
            title: "English du lịch",
            cover:
                "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
            vocabCount: 240,
            partsCount: 4,
        },
    ];
    const [courses, setCourses] = useState(initialCourses);
    const [selectedCourse, setSelectedCourse] = useState<CoursePayload | undefined>(undefined);
    const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);

    return (
        <>
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
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} onCourseClick={() => {
                            setSelectedCourse(course);
                            setIsCourseDialogOpen(true);
                        }} />
                    ))}
                </div>
            </div>
            <CourseDialog
                isOpen={isCourseDialogOpen}
                onSubmit={(course) => {
                    setCourses((prev) => [...prev, { ...course, id: course.id ?? "", vocabCount: 0, partsCount: 0 }]);
                    setIsCourseDialogOpen(false);
                }}
                onClose={() => setIsCourseDialogOpen(false)}
                mode="create"
                dialogTitle={selectedCourse ? "Chỉnh sửa khóa học" : "Tạo khóa học"}
                course={selectedCourse}
            />
        </>

    );
}