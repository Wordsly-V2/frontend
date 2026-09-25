"use client";

import { PathLessonScreen } from "@/components/features/path/path-lesson-screen";
import { use } from "react";

export default function PathLessonPage({
    params,
}: Readonly<{ params: Promise<{ lessonId: string }> }>) {
    const { lessonId } = use(params);

    return (
        <main className="min-h-dvh px-3 pb-16 pt-3 sm:px-4 md:pt-6">
            <div className="mx-auto max-w-2xl">
                <PathLessonScreen lessonId={lessonId} />
            </div>
        </main>
    );
}
