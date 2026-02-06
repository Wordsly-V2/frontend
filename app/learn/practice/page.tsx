"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import VocabularyPractice, { WordResult } from "@/components/features/vocabulary/vocabulary-practice";
import { Button } from "@/components/ui/button";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import { useRecordAnswersMutation } from "@/queries/word-progress.query";
import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

export default function PracticePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const courseName = searchParams.get("courseName") || "";
    const courseId = searchParams.get("courseId") || "";
    const wordIds = searchParams.get("wordIds") || "";

    if (!courseName  || !courseId || !wordIds) {
        router.push(`/learn`);
    }

    const { data: words, isLoading: isWordsLoading, isError: isWordsError, refetch: refetchWords } = useGetWordsByIdsQuery(courseId, wordIds.split(","), !!courseId && !!wordIds);
    const recordAnswersMutation = useRecordAnswersMutation();

    const handleComplete = useCallback(async (score: number, wordResults: WordResult[]) => {
        
        // Submit bulk progress update
        try {
            await recordAnswersMutation.mutateAsync({
                answers: wordResults
            });
            
            toast.success("Practice completed! Your progress has been saved.");
            router.push(`/learn/courses/${courseId}`);
        } catch (error) {
            console.error("Failed to save progress:", error);
            toast.error("Failed to save your progress. Please try again.");
            
            // Still navigate to course page even if save fails
            setTimeout(() => {
                router.push(`/learn/courses/${courseId}`);
            }, 2000);
        }
    }, [courseId, router, recordAnswersMutation]);

    const handleBackToCourse = () => {
        const courseId = searchParams.get("courseId");
        router.push(`/learn/courses/${courseId}`);
    };


    if(isWordsLoading || isWordsError) {
        return <LoadingSection isLoading={isWordsLoading} error={isWordsError ? 'Error loading words' : null} refetch={refetchWords} />;
    }

    if (!words || words.length === 0) {
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
        <main className="bg-background flex flex-col">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 max-w-4xl flex flex-col">
                <Button
                    variant="ghost"
                    onClick={handleBackToCourse}
                    className="mb-3 sm:mb-4 self-start flex-shrink-0"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course
                </Button>
                <div className="text-center mb-4 sm:mb-6 flex-shrink-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                        Practice Vocabulary
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        {courseName} • {words.length} words
                    </p>
                </div>
                <div className="flex-1 pb-4">
                    <VocabularyPractice words={words} onComplete={handleComplete} />
                </div>
            </div>
        </main>
    );
}
