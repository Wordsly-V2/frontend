"use client";

import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CoursesHeaderProps {
    onCreateCourse?: () => void;
    onSearch?: (query: string) => void;
    totalCourses: number;
    searchQuery: string;
}

export default function CoursesHeader({
    onCreateCourse,
    onSearch,
    searchQuery,
    totalCourses,
}: Readonly<CoursesHeaderProps>) {
    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Library
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">My courses</h2>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                        {totalCourses} course{totalCourses === 1 ? "" : "s"}
                        {searchQuery.length > 0 ? ` matching “${searchQuery}”` : ""}
                    </p>
                </div>
                {onCreateCourse && (
                    <Button
                        onClick={onCreateCourse}
                        size="default"
                        className="h-10 w-full shrink-0 rounded-xl sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        New course
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative max-w-md flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        placeholder="Search by course name…"
                        className="h-10 pl-9"
                        onChange={(e) => onSearch?.(e.target.value)}
                        aria-label="Search courses"
                    />
                </div>
                {/* Future: Add filter buttons here */}
            </div>
        </div>
    );
}
