"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, FileText, MessageSquare } from "lucide-react";
import { getAllCourses } from "@/lib/data-store";
import { ICourse } from "@/types/courses/courses.type";

export default function ManagePage() {
    const router = useRouter();
    const [courses, setCourses] = useState<ICourse[]>([]);

    useEffect(() => {
        setCourses(getAllCourses());
    }, []);

    const totalLessons = courses.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
    const totalWords = courses.reduce(
        (sum, c) => sum + (c.lessons?.reduce((lsum, l) => lsum + (l.words?.length || 0), 0) || 0),
        0
    );

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Management Dashboard</h1>
                    <p className="text-muted-foreground">
                        Create, edit, and organize your learning content
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card border-2 border-border rounded-2xl p-6 hover:border-primary/50 transition-all cursor-pointer card-hover" onClick={() => router.push('/manage/courses')}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center">
                                <BookOpen className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{courses.length}</p>
                                <p className="text-sm text-muted-foreground">Courses</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border-2 border-border rounded-2xl p-6 hover:border-primary/50 transition-all cursor-pointer card-hover" onClick={() => router.push('/manage/courses')}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center">
                                <FileText className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalLessons}</p>
                                <p className="text-sm text-muted-foreground">Lessons</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border-2 border-border rounded-2xl p-6 hover:border-primary/50 transition-all cursor-pointer card-hover" onClick={() => router.push('/manage/courses')}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <MessageSquare className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold">{totalWords}</p>
                                <p className="text-sm text-muted-foreground">Words</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-card border-2 border-border rounded-2xl p-8">
                    <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            size="lg"
                            className="h-16 text-base"
                            onClick={() => router.push('/manage/courses')}
                        >
                            <BookOpen className="h-5 w-5 mr-2" />
                            Manage Courses
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-16 text-base"
                            onClick={() => router.push('/learn')}
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Switch to Learn Mode
                        </Button>
                    </div>
                </div>

                {/* Getting Started */}
                {courses.length === 0 && (
                    <div className="mt-8 bg-primary/5 border-2 border-primary/20 rounded-2xl p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Get Started</h3>
                            <p className="text-muted-foreground mb-6">
                                Create your first course to start building your vocabulary learning content
                            </p>
                            <Button onClick={() => router.push('/manage/courses')}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Course
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
