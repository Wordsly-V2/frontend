"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VocabularyPractice from "@/components/features/vocabulary/vocabulary-practice";
import { getLessonById } from "@/lib/data-store";

export default function LessonPracticeStartPage({
    params,
}: {
    params: Promise<{ id: string; lessonId: string }>;
}) {
    const { id, lessonId } = use(params);
    const router = useRouter();
    const [lesson, setLesson] = useState(getLessonById(lessonId));

    useEffect(() => {
        setLesson(getLessonById(lessonId));
    }, [lessonId]);

    if (!lesson || !lesson.words || lesson.words.length === 0) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No words to practice</h2>
                    <Button onClick={() => router.push(`/learn/courses/${id}`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Course
                    </Button>
                </div>
            </main>
        );
    }

    // Shuffle words
    const shuffledWords = [...lesson.words].sort(() => Math.random() - 0.5);

    const handleComplete = (score: number) => {
        console.log("Lesson practice complete! Score:", score);
        router.push(`/learn/courses/${id}/lessons/${lessonId}/practice`);
    };

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/learn/courses/${id}/lessons/${lessonId}/practice`)}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Lesson
                    </Button>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-2">Practice: {lesson.name}</h1>
                        <p className="text-muted-foreground">{shuffledWords.length} words</p>
                    </div>
                </div>

                <VocabularyPractice words={shuffledWords} onComplete={handleComplete} />
            </div>
        </main>
    );
}
