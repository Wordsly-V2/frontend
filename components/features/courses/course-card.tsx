"use client";

import { WordProgressStatsInline } from "@/components/common/word-progress-stats";
import { ICourse } from "@/types/courses/courses.type";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";

interface CourseCardProps {
    course: ICourse;
}

export default function CourseCard({ course }: Readonly<CourseCardProps>) {
    const lessonCount = course.totalLessonsCount || 0;
    const wordCount = course.totalWordsCount || 0;
    const stats = course.wordProgressStats ?? undefined;
    const startedCount = stats
        ? stats.learningWords + stats.reviewWords
        : 0;
    const progressPercent =
        wordCount > 0 && stats ? (startedCount / stats.totalWords) * 100 : 0;

    return (
        <Link href={`/learn/courses/${course.id}`} className="block group">
            <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border card-hover">
                {/* Image */}
                <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-muted">
                    {course.coverImageUrl ? (
                        <Image
                            src={course.coverImageUrl}
                            alt={course.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center gradient-brand">
                            <GraduationCap className="h-12 w-12 sm:h-16 sm:w-16 text-white/80" />
                        </div>
                    )}
                    {/* Overlay gradient for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5">
                    <h3 className="font-semibold text-base sm:text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {course.name}
                    </h3>

                    {/* Stats */}
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}</span>
                        </div>
                        {wordCount > 0 && (
                            <div className="flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <span>{wordCount} words</span>
                            </div>
                        )}
                    </div>

                    {/* Word progress stats inline */}
                    {stats && wordCount > 0 && (
                        <WordProgressStatsInline
                            stats={stats}
                            totalWords={wordCount}
                            className="mt-2"
                        />
                    )}

                    {/* Progress bar */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span>{stats && startedCount > 0 ? "Learning progress" : "Start learning"}</span>
                            {stats && wordCount > 0 && (
                                <span>{startedCount} / {stats.totalWords} started</span>
                            )}
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
