"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import WordDetailsCarousel from "@/components/features/vocabulary/word-details-carousel";
import { Button } from "@/components/ui/button";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export default function WordsDetailsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentIndex, setCurrentIndex] = useState(0);
    const reduceMotion = useReducedMotion();

    const courseName = searchParams.get("courseName") ?? "";
    const courseId = searchParams.get("courseId") ?? "";
    const wordIdsParam = searchParams.get("wordIds") ?? "";
    const wordIds = wordIdsParam ? wordIdsParam.split(",").filter(Boolean) : [];

    const { data: words, isLoading, isError, refetch } = useGetWordsByIdsQuery(
        courseId,
        wordIds,
        !!courseId && wordIds.length > 0
    );

    useEffect(() => {
        if (courseId && wordIds.length === 0) {
            router.replace("/learn");
        }
    }, [courseId, wordIds.length, router]);

    const handleBackToCourse = () => {
        if (courseId) router.push(`/learn/courses/${courseId}`);
        else router.push("/learn");
    };

    if (isLoading || isError) {
        return (
            <LoadingSection
                isLoading={isLoading}
                error={isError ? "Error loading words" : null}
                refetch={refetch}
            />
        );
    }

    if (!words || words.length === 0) {
        return (
            <main className="min-h-dvh bg-background flex items-center justify-center">
                <div className="text-center px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">No words to view</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Select words from your course to see their details here.
                    </p>
                    <Button onClick={handleBackToCourse}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Course
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="bg-gradient-to-b from-background via-background to-muted/30">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-3xl flex flex-col">
                <Button
                    variant="ghost"
                    onClick={handleBackToCourse}
                    className="mb-4 self-start text-muted-foreground hover:text-foreground"
                    size="sm"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course
                </Button>

                <header className="text-center mb-6 sm:mb-8 flex-shrink-0">
                    <motion.h1
                        className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                            reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                        }
                    >
                        Word details
                    </motion.h1>
                    <motion.p
                        className="mt-1.5 text-sm sm:text-base text-muted-foreground"
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={
                            reduceMotion ? { duration: 0 } : { duration: 0.28, delay: 0.05 }
                        }
                    >
                        {courseName && (
                            <span className="font-medium text-foreground/80">{courseName}</span>
                        )}
                        {courseName && " · "}
                        <span>{words.length} word{words.length === 1 ? "" : "s"}</span>
                    </motion.p>
                </header>

                <section className="flex-1 flex flex-col min-h-0">
                    <WordDetailsCarousel
                        words={words}
                        onIndexChange={setCurrentIndex}
                        headerSlot={
                            <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                {currentIndex + 1} / {words.length}
                            </span>
                        }
                        className="flex-1"
                    />
                </section>
            </div>
        </main>
    );
}
