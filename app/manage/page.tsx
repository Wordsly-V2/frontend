"use client";

import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useGetMyCoursesTotalStatsQuery } from "@/queries/courses.query";
import { BookOpen, FileText, MessageSquare, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";

export default function ManagePage() {
    const router = useRouter();

    const { data: courseTotalStats, isLoading, isError, refetch: refetchCourseTotalStats, error } = useGetMyCoursesTotalStatsQuery();

    useEffect(() => {
        if (isError) {
            toast.error('Failed to load course total stats: ' + error?.message);
        }
    }, [isError, error]);

    const handleClickTotalStats = () => {
        if (isLoading || isError) {
            refetchCourseTotalStats();
        } else {
            router.push('/manage/courses');
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">Management Dashboard</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Create, edit, and organize your learning content
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-card border-2 border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary/50 transition-all cursor-pointer card-hover" onClick={handleClickTotalStats}>
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl gradient-brand flex items-center justify-center flex-shrink-0">
                                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                            </div>
                            <div className="min-w-0">
                                {
                                    isLoading ? (
                                        <LoadingSpinner size="sm" />
                                    ) : isError ? (
                                        <p className="text-2xl sm:text-3xl font-bold">--</p>
                                    ) : (
                                        <p className="text-2xl sm:text-3xl font-bold">{courseTotalStats?.totalCourses || 0}</p>
                                    )
                                }
                                <p className="text-xs sm:text-sm text-muted-foreground">Courses</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border-2 border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary/50 transition-all cursor-pointer card-hover" onClick={handleClickTotalStats}>
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl gradient-accent flex items-center justify-center flex-shrink-0">
                                <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                            </div>
                            <div className="min-w-0">
                                {
                                    isLoading ? (
                                        <LoadingSpinner size="sm" />
                                    ) : isError ? (
                                        <p className="text-2xl sm:text-3xl font-bold">--</p>
                                    ) : (
                                        <p className="text-2xl sm:text-3xl font-bold">{courseTotalStats?.totalLessons || 0}</p>
                                    )
                                }
                                <p className="text-xs sm:text-sm text-muted-foreground">Lessons</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border-2 border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary/50 transition-all cursor-pointer card-hover" onClick={handleClickTotalStats}>
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                            </div>
                            <div className="min-w-0">
                                {
                                    isLoading ? (
                                        <LoadingSpinner size="sm" />
                                    ) : isError ? (
                                        <p className="text-2xl sm:text-3xl font-bold">--</p>
                                    ) : (
                                        <p className="text-2xl sm:text-3xl font-bold">{courseTotalStats?.totalWords || 0}</p>
                                    )
                                }
                                <p className="text-xs sm:text-sm text-muted-foreground">Words</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-card border-2 border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                    <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Button
                            size="lg"
                            className="h-12 sm:h-16 text-sm sm:text-base"
                            onClick={() => router.push('/manage/courses')}
                        >
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Manage Courses
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 sm:h-16 text-sm sm:text-base"
                            onClick={() => router.push('/learn')}
                        >
                            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Switch to Learn Mode
                        </Button>
                    </div>
                </div>

                {/* Getting Started */}
                {courseTotalStats?.totalCourses === 0 && (
                    <div className="mt-6 sm:mt-8 bg-primary/5 border-2 border-primary/20 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Get Started</h3>
                            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                                Create your first course to start building your vocabulary learning content
                            </p>
                            <Button onClick={() => router.push('/manage/courses')} size="sm" className="text-sm sm:text-base">
                                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                                Create First Course
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
