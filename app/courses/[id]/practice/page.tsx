"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VocabularyPractice from "@/components/features/vocabulary/vocabulary-practice";
import { getCourseById } from "@/lib/dummy-data";
import { IWord } from "@/types/courses/courses.type";

export default function CoursePracticePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const course = getCourseById(id);

    if (!course) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Course not found</h2>
                    <Button onClick={() => router.push('/courses')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Courses
                    </Button>
                </div>
            </main>
        );
    }

    // Collect all words from all lessons
    const allWords: IWord[] = [];
    course.lessons?.forEach((lesson) => {
        if (lesson.words) {
            allWords.push(...lesson.words);
        }
    });

    // Shuffle words for practice
    const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);

    const handleComplete = (score: number) => {
        // TODO: Save progress to backend
        console.log("Practice complete! Score:", score);
        router.push(`/courses/${id}`);
    };

    if (allWords.length === 0) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No words to practice</h2>
                    <p className="text-muted-foreground mb-6">
                        Add some words to your lessons first
                    </p>
                    <Button onClick={() => router.push(`/courses/${id}`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Course
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/courses/${id}`)}
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Course
                    </Button>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-2">Practice Vocabulary</h1>
                        <p className="text-muted-foreground">
                            {course.name} • {allWords.length} words
                        </p>
                    </div>
                </div>

                {/* Practice Component */}
                <VocabularyPractice words={shuffledWords} onComplete={handleComplete} />
            </div>
        </main>
    );
}
