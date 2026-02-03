"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VocabularyPractice from "@/components/features/vocabulary/vocabulary-practice";
import { getCourseById } from "@/lib/data-store";
import { IWord } from "@/types/courses/courses.type";

export default function CoursePracticePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [course, setCourse] = useState(getCourseById(id));

    useEffect(() => {
        setCourse(getCourseById(id));
    }, [id]);

    if (!course) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Course not found</h2>
                    <Button onClick={() => router.push('/learn')}>
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
        console.log("Practice complete! Score:", score);
        router.push(`/learn/courses/${id}`);
    };

    if (allWords.length === 0) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No words to practice</h2>
                    <p className="text-muted-foreground mb-6">
                        This course doesn&apos;t have any words yet
                    </p>
                    <Button onClick={() => router.push(`/learn/courses/${id}`)}>
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
                        onClick={() => router.push(`/learn/courses/${id}`)}
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
