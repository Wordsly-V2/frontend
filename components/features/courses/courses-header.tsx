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
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Courses</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        {totalCourses} courses found {searchQuery.length > 0 ? `for "${searchQuery}"` : ''}
                    </p>
                </div>
                {onCreateCourse && (
                    <Button onClick={onCreateCourse} size="default" className="self-start md:self-auto w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Course
                    </Button>
                )}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        placeholder="Search courses..."
                        className="pl-9 h-10"
                        onChange={(e) => onSearch?.(e.target.value)}
                    />
                </div>
                {/* Future: Add filter buttons here */}
            </div>
        </div>
    );
}
