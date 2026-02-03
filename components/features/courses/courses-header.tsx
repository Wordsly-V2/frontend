"use client";

import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CoursesHeaderProps {
    onCreateCourse?: () => void;
    onSearch?: (query: string) => void;
    totalCourses: number;
}

export default function CoursesHeader({
    onCreateCourse,
    onSearch,
    totalCourses,
}: Readonly<CoursesHeaderProps>) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                    <p className="text-muted-foreground mt-1">
                        {totalCourses === 0
                            ? "Create your first course to start learning"
                            : `${totalCourses} ${totalCourses === 1 ? 'course' : 'courses'} in your library`}
                    </p>
                </div>
                {onCreateCourse && (
                    <Button onClick={onCreateCourse} size="lg" className="self-start md:self-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Course
                    </Button>
                )}
            </div>

            {/* Search & Filters */}
            {totalCourses > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search courses..."
                            className="pl-9"
                            onChange={(e) => onSearch?.(e.target.value)}
                        />
                    </div>
                    {/* Future: Add filter buttons here */}
                </div>
            )}
        </div>
    );
}
