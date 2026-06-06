"use client";

import { WordProgressStatsInline } from "@/components/common/word-progress-stats";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ICourse } from "@/types/courses/courses.type";
import type { IWordProgressStats } from "@/types/word-progress/word-progress.type";
import { BookOpen, Edit, GraduationCap, MoreHorizontal, PenLine, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ManageCourseCardProps {
    course: ICourse;
    wordProgressStats?: IWordProgressStats;
    onEdit: (course: ICourse) => void;
    onDelete: (course: ICourse) => void;
}

export default function ManageCourseCard({
    course,
    wordProgressStats,
    onEdit,
    onDelete,
}: Readonly<ManageCourseCardProps>) {
    const lessonCount = course.totalLessonsCount || 0;
    const wordCount = course.totalWordsCount || 0;

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-colors hover:border-primary/30">
            <Link
                href={`/manage/courses/${course.id}`}
                className="block min-w-0 flex-1"
            >
                <div className="relative h-36 w-full overflow-hidden bg-muted sm:h-40">
                    {course.coverImageUrl ? (
                        <Image
                            src={course.coverImageUrl}
                            alt={course.name}
                            fill
                            className="object-cover transition duration-300 group-hover:brightness-[0.97]"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center gradient-brand">
                            <GraduationCap className="h-10 w-10 text-white/80 sm:h-12 sm:w-12" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                </div>

                <div className="p-4 sm:p-5">
                    <h3 className="mb-2 line-clamp-2 text-base font-semibold transition-colors group-hover:text-primary sm:text-lg">
                        {course.name}
                    </h3>

                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"} · {wordCount}{" "}
                        {wordCount === 1 ? "word" : "words"}
                    </p>

                    {wordProgressStats && wordCount > 0 ? (
                        <WordProgressStatsInline
                            stats={wordProgressStats}
                            totalWords={wordCount}
                            className="mt-2"
                        />
                    ) : null}
                </div>
            </Link>

            <div className="mt-auto flex items-center gap-2 border-t border-border p-3 sm:p-4">
                <Button
                    size="sm"
                    className="h-9 flex-1 rounded-xl text-xs sm:text-sm"
                    asChild
                >
                    <Link href={`/manage/courses/${course.id}`}>
                        <PenLine className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Edit content</span>
                        <span className="sm:hidden">Edit</span>
                    </Link>
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl text-xs sm:text-sm"
                    asChild
                >
                    <Link href={`/learn/courses/${course.id}`}>
                        <BookOpen className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Study</span>
                    </Link>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-9 w-9 shrink-0 rounded-xl p-0"
                            aria-label={`More actions for ${course.name}`}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => onEdit(course)}>
                            <Edit className="h-4 w-4" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDelete(course)}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </article>
    );
}
