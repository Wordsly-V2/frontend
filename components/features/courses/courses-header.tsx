"use client";

import { Button } from "@/components/ui/button";
import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { ReactNode } from "react";

interface CoursesHeaderProps {
    onCreateCourse?: () => void;
    onSearch?: (query: string) => void;
    totalCourses: number;
    searchQuery: string;
    sectionLabel?: string;
    title?: string;
    searchPlaceholder?: string;
    /** `h1` when this header is the page's own title. */
    headingAs?: "h1" | "h2";
    /** Extra buttons beside the title (below it on small screens). */
    actions?: ReactNode;
}

export default function CoursesHeader({
    onCreateCourse,
    onSearch,
    searchQuery,
    totalCourses,
    sectionLabel = "Library",
    title = "My courses",
    searchPlaceholder = "Search by course name…",
    headingAs: Heading = "h2",
    actions,
}: Readonly<CoursesHeaderProps>) {
    return (
        <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    {sectionLabel && (
                        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            {sectionLabel}
                        </p>
                    )}
                    <Heading
                        className={
                            Heading === "h1"
                                ? "font-display text-2xl font-bold tracking-tight sm:text-3xl"
                                : "font-display text-xl font-bold tracking-tight"
                        }
                    >
                        {title}
                    </Heading>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                        {totalCourses} course{totalCourses === 1 ? "" : "s"}
                        {searchQuery.length > 0 ? ` matching “${searchQuery}”` : ""}
                    </p>
                </div>
                {actions}
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
                        type="search"
                        value={searchQuery}
                        placeholder={searchPlaceholder}
                        className="h-10 pl-9 pr-9"
                        onChange={(e) => onSearch?.(e.target.value)}
                        aria-label="Search courses"
                    />
                    {searchQuery.length > 0 && (
                        <button
                            type="button"
                            onClick={() => onSearch?.("")}
                            aria-label="Clear search"
                            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="h-4 w-4" aria-hidden />
                        </button>
                    )}
                </div>
                {/* Future: Add filter buttons here */}
            </div>
        </div>
    );
}
