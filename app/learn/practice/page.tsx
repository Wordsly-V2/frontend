"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VocabularyPractice from "@/components/features/vocabulary/vocabulary-practice";
import { IWord } from "@/types/courses/courses.type";
import { getCourseById } from "@/lib/data-store";

export default function PracticePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [words, setWords] = useState<IWord[]>([]);
    const [courseName, setCourseName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const courseId = searchParams.get("courseId");
        const wordIds = searchParams.get("wordIds");

        if (!courseId || !wordIds) {
            router.push("/learn");
            return;
        }

        const course = getCourseById(courseId);
        if (!course) {
            router.push("/learn");
            return;
        }

        setCourseName(course.name);

        // Get all words from the course
        const allWords: IWord[] = [];
        course.lessons?.forEach((lesson) => {
            if (lesson.words) {
                allWords.push(...lesson.words);
            }
        });

        // Filter selected words
        const selectedWordIds = wordIds.split(",");
        const selectedWords = allWords.filter((word) =>
            selectedWordIds.includes(word.id)
        );

        setWords(selectedWords);
        setIsLoading(false);
    }, [searchParams, router]);

    const handleComplete = (score: number) => {
        const courseId = searchParams.get("courseId");
        console.log("Practice complete! Score:", score);
        router.push(`/learn/courses/${courseId}`);
    };

    const handleBackToCourse = () => {
        const courseId = searchParams.get("courseId");
        router.push(`/learn/courses/${courseId}`);
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-4 text-muted-foreground">Loading practice...</p>
                </div>
            </main>
        );
    }

    if (words.length === 0) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">No words selected</h2>
                    <Button onClick={handleBackToCourse}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Course
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="h-[calc(100vh-4rem)] bg-background flex flex-col overflow-hidden">
            <div className="container mx-auto px-4 py-6 max-w-4xl h-full flex flex-col">
                <Button
                    variant="ghost"
                    onClick={handleBackToCourse}
                    className="mb-4 self-start flex-shrink-0"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course
                </Button>
                <div className="text-center mb-6 flex-shrink-0">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                        Practice Vocabulary
                    </h1>
                    <p className="text-muted-foreground">
                        {courseName} • {words.length} words
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <VocabularyPractice words={words} onComplete={handleComplete} />
                </div>
            </div>
        </main>
    );
}
