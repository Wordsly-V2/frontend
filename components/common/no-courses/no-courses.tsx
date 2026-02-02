'use client';

import { Button } from "@/components/ui/button";

interface NoCoursesProps {
    onCreateCourse: () => void;
}

export function NoCourses({ onCreateCourse }: NoCoursesProps) {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {/* Icon/Illustration */}
                <div className="mb-6 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full blur-2xl opacity-20" />
                        <div className="relative bg-white dark:bg-slate-800 rounded-full p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                            <svg
                                className="w-16 h-16 text-slate-400 dark:text-slate-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                        Chưa có khóa học nào
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
                        Bắt đầu hành trình học từ vựng của bạn bằng cách tạo khóa học đầu tiên.
                        Tổ chức từ vựng theo chủ đề để học hiệu quả hơn.
                    </p>
                </div>

                {/* Action Button */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={onCreateCourse}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                        <svg
                            className="mr-2 h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Tạo khóa học đầu tiên
                    </Button>
                </div>

                {/* Additional Info */}
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                        💡 Mẹo: Tạo khóa học theo chủ đề như "Tiếng Anh giao tiếp", "Từ vựng IELTS", hoặc "Thuật ngữ công nghệ"
                    </p>
                </div>
            </div>
        </main>
    );
}
