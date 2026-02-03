"use client";

import { ICourse } from "@/types/courses/courses.type";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, GraduationCap } from "lucide-react";

interface CourseCardProps {
    course: ICourse;
}

export default function CourseCard({ course }: Readonly<CourseCardProps>) {
    const lessonCount = course.lessons?.length || 0;
    const wordCount = course.lessons?.reduce((sum, lesson) => sum + (lesson.words?.length || 0), 0) || 0;

    return (
        <Link href={`/courses/${course.id}`} className="block group">
            <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border card-hover">
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                    {course.coverImageUrl ? (
                        <Image
                            src={course.coverImageUrl}
                            alt={course.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center gradient-brand">
                            <GraduationCap className="h-16 w-16 text-white/80" />
                        </div>
                    )}
                    {/* Overlay gradient for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {course.name}
                    </h3>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4" />
                            <span>{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}</span>
                        </div>
                        {wordCount > 0 && (
                            <div className="flex items-center gap-1.5">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <span>{wordCount} words</span>
                            </div>
                        )}
                    </div>

                    {/* Progress bar placeholder */}
                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span>Start learning</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-0 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
