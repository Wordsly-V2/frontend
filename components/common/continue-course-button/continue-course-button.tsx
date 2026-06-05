"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import Link from "next/link";

interface ContinueCourseButtonProps {
    courseId: string;
    courseName: string;
    variant?: "default" | "outline";
    className?: string;
}

/** Continue link with truncation — overrides Button `whitespace-nowrap` for long course names. */
export function ContinueCourseButton({
    courseId,
    courseName,
    variant = "default",
    className,
}: Readonly<ContinueCourseButtonProps>) {
    return (
        <Button
            variant={variant}
            className={cn(
                "w-full min-w-0 max-w-full whitespace-normal !shrink overflow-hidden rounded-xl",
                className,
            )}
            asChild
        >
            <Link
                href={`/learn/courses/${courseId}`}
                title={`Continue: ${courseName}`}
                className="inline-flex min-w-0 w-full max-w-full items-center gap-2 overflow-hidden"
            >
                <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-left">
                    Continue: {courseName}
                </span>
            </Link>
        </Button>
    );
}
