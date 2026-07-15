"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import WordDetailsCarousel from "@/components/features/vocabulary/word-details-carousel";
import { DictionaryLookupDialog } from "@/components/features/dictionary/dictionary-lookup-dialog";
import { Button } from "@/components/ui/button";
import { wordSelectionSearchParams } from "@/lib/search-params/word-selection";
import { useGetWordsByIdsQuery } from "@/queries/words.query";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export default function WordsDetailsPage() {
    const router = useRouter();
    const [{ courseId, courseName, wordIds }] = useQueryStates(wordSelectionSearchParams);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lookupOpen, setLookupOpen] = useState(false);
    const reduceMotion = useReducedMotion();

    const wordIdList = wordIds ?? [];
    const paramsValid = Boolean(courseId && wordIdList.length > 0);

    const { data: words, isLoading, isError, refetch } = useGetWordsByIdsQuery(
        courseId ?? "",
        wordIdList,
        paramsValid,
    );

    useEffect(() => {
        if (!paramsValid) {
            router.replace("/learn");
        }
    }, [paramsValid, router]);

    const handleBackToCourse = () => {
        if (courseId) router.push(`/learn/courses/${courseId}`);
        else router.push("/learn");
    };

    if (!paramsValid) {
        return (
            <main className="flex min-h-dvh items-center justify-center px-4">
                <p className="text-sm text-muted-foreground">Taking you to Learn…</p>
            </main>
        );
    }

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
                <div className="mb-4 flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleBackToCourse}
                        className="text-muted-foreground hover:text-foreground"
                        size="sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Course
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setLookupOpen(true)}
                        size="sm"
                    >
                        <Search className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Look up a word</span>
                    </Button>
                </div>

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

            <DictionaryLookupDialog open={lookupOpen} onOpenChange={setLookupOpen} />
        </main>
    );
}
