"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import VocabularyList from "@/components/features/vocabulary/vocabulary-list";
import { getLessonById } from "@/lib/dummy-data";

export default function LessonPracticePage({
    params,
}: {
    params: Promise<{ id: string; lessonId: string }>;
}) {
    const { id, lessonId } = use(params);
    const router = useRouter();
    const lesson = getLessonById(lessonId);

    if (!lesson) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Lesson not found</h2>
                    <Button onClick={() => router.push(`/courses/${id}`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Course
                    </Button>
                </div>
            </main>
        );
    }

    const words = lesson.words || [];

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/courses/${id}`)}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course
                </Button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{lesson.name}</h1>
                        <p className="text-muted-foreground">
                            {words.length} {words.length === 1 ? 'word' : 'words'} in this lesson
                        </p>
                    </div>
                    {words.length > 0 && (
                        <Button
                            size="lg"
                            onClick={() =>
                                router.push(`/courses/${id}/lessons/${lessonId}/practice/start`)
                            }
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Start Practice
                        </Button>
                    )}
                </div>

                {/* Vocabulary List */}
                <VocabularyList words={words} layout="list" showMeaning />
            </div>
        </main>
    );
}
