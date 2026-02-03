"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Plus } from "lucide-react";
import Image from "next/image";
import LessonList from "@/components/features/lessons/lesson-list";
import { getCourseById } from "@/lib/dummy-data";
import { ILesson } from "@/types/courses/courses.type";

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const course = getCourseById(id);
    const [lessons, setLessons] = useState<ILesson[]>(course?.lessons || []);

    if (!course) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Course not found</h2>
                    <Button onClick={() => router.push('/courses')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Courses
                    </Button>
                </div>
            </main>
        );
    }

    const totalWords = lessons.reduce((sum, l) => sum + (l.words?.length || 0), 0);

    const handleReorderLessons = (reorderedLessons: ILesson[]) => {
        setLessons(reorderedLessons);
        // TODO: Save to backend
    };

    const handleLessonClick = (lessonId: string) => {
        router.push(`/courses/${id}/lessons/${lessonId}/practice`);
    };

    const handleCreateLesson = () => {
        // TODO: Open create lesson dialog
        console.log("Create lesson");
    };

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => router.push('/courses')}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    All Courses
                </Button>

                {/* Course Header */}
                <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border mb-8">
                    {course.coverImageUrl && (
                        <div className="relative h-64 w-full">
                            <Image
                                src={course.coverImageUrl}
                                alt={course.name}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                    {course.name}
                                </h1>
                                <div className="flex items-center gap-4 text-white/90">
                                    <span className="flex items-center gap-1.5">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        {lessons.length} lessons
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                        {totalWords} words
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions & Stats */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-semibold mb-1">Lessons</h2>
                        <p className="text-muted-foreground text-sm">
                            {lessons.length === 0
                                ? "Create your first lesson to start learning"
                                : "Select a lesson to begin practicing"}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleCreateLesson} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Lesson
                        </Button>
                        {totalWords > 0 && (
                            <Button onClick={() => router.push(`/courses/${id}/practice`)}>
                                <Play className="h-4 w-4 mr-2" />
                                Practice All
                            </Button>
                        )}
                    </div>
                </div>

                {/* Lessons List */}
                <LessonList
                    lessons={lessons}
                    onLessonClick={handleLessonClick}
                    onReorder={handleReorderLessons}
                    sortable
                />

                {/* Progress Overview (Future Feature) */}
                {lessons.length > 0 && (
                    <div className="mt-8 p-6 bg-card border border-border rounded-lg">
                        <h3 className="font-semibold mb-4">Your Progress</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Words Learned</p>
                                <p className="text-2xl font-bold">0 / {totalWords}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Study Streak</p>
                                <p className="text-2xl font-bold">0 days</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Completion</p>
                                <p className="text-2xl font-bold">0%</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
