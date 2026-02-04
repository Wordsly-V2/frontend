"use client";

import { useState, useEffect } from "react";
import CoursesHeader from "@/components/features/courses/courses-header";
import CourseGrid from "@/components/features/courses/course-grid";
import { Pagination } from "@/components/ui/pagination";
import { ICourse } from "@/types/courses/courses.type";
import { IPaginatedResponse } from "@/types/common/pagination.type";
import { getMyCourses } from "@/apis/courses.api";

export default function LearnPage() {
    const [paginatedData, setPaginatedData] = useState<IPaginatedResponse<ICourse>>({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        items: [],
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 2;

    // Load all courses for stats and search
    useEffect(() => {
        // const loadedCourses = getAllCourses();
        // setAllCourses(loadedCourses);

        getMyCourses(itemsPerPage, currentPage).then((res) => {
            setPaginatedData({
                totalItems: res.totalItems,
                totalPages: res.totalPages,
                currentPage: res.currentPage,
                items: res.items,
            });
        });
    }, []);

    // // Load paginated courses when page or search changes
    // useEffect(() => {
    //     if (searchQuery.trim()) {
    //         // Client-side search with pagination
    //         const filtered = allCourses.filter((course) =>
    //             course.name.toLowerCase().includes(searchQuery.toLowerCase())
    //         );
            
    //         const startIndex = (currentPage - 1) * itemsPerPage;
    //         const endIndex = startIndex + itemsPerPage;
    //         const paginatedFiltered = filtered.slice(startIndex, endIndex);

    //         setPaginatedData({
    //             totalItems: filtered.length,
    //             totalPages: Math.ceil(filtered.length / itemsPerPage),
    //             currentPage: currentPage,
    //             data: paginatedFiltered,
    //         });
    //     } else {
    //         // Normal pagination
    //         const result = getPaginatedCourses({ page: currentPage, limit: itemsPerPage });
    //         setPaginatedData(result);
    //     }
    // }, [currentPage, searchQuery, allCourses]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to first page on search
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-7xl">

                {/* Stats Section */}
                {/* {allCourses.length > 0 && ( */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg gradient-brand flex items-center justify-center">
                                    <svg
                                        className="h-6 w-6 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{paginatedData.totalItems}</p>
                                    <p className="text-sm text-muted-foreground">Courses</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center">
                                    <svg
                                        className="h-6 w-6 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {paginatedData.items.reduce((sum, c) => sum + (c.totalLessonsCount || 0), 0)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Lessons</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                    <svg
                                        className="h-6 w-6 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">
                                        {paginatedData.items.reduce((sum, c) => sum + (c.totalWordsCount || 0), 0)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Words</p>
                                </div>
                            </div>
                        </div>
                    </div>
                {/* )} */}

                <CoursesHeader
                    totalCourses={paginatedData.totalItems}
                    onSearch={handleSearch}
                />

                <div className="mt-8">
                    <CourseGrid courses={paginatedData.items} />
                </div>

                <Pagination
                    currentPage={paginatedData.currentPage}
                    totalPages={paginatedData.totalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        </main>
    );
}
