"use client";

import LoadingSection from "@/components/common/loading-section/loading-section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetCourseDetailByIdQuery } from "@/queries/courses.query";
import { useGetDueWordIdsQuery, useGetDueWordsQuery } from "@/queries/word-progress.query";
import { ILesson, IWord } from "@/types/courses/courses.type";
import { LearningProgressSection, WordProgressBadge, WordProgressStatsInline } from "@/components/common/word-progress-stats";
import { ArrowLeft, Brain, ChevronDown, ChevronRight, Play, Volume2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";

export default function LearnCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
    const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());

    const { data: course, isLoading, isError, refetch: loadCourseDetail } = useGetCourseDetailByIdQuery(id, !!id);
    const { data: dueWordIds, isLoading: isDueWordIdsLoading } = useGetDueWordIdsQuery(id, undefined, 20, true, !!id);

    const lessons = course?.lessons || [];

    if (isLoading || isError) {
        return <LoadingSection isLoading={isLoading} error={isError ? 'Error loading course' : null} refetch={loadCourseDetail} />;
    }

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

    const totalWords = lessons.reduce((sum, l) => sum + (l.words?.length || 0), 0);
    const allWords: IWord[] = [];
    lessons.forEach((lesson) => {
        if (lesson.words) {
            allWords.push(...lesson.words);
        }
    });

    const toggleLesson = (lessonId: string) => {
        const newExpanded = new Set(expandedLessons);
        if (newExpanded.has(lessonId)) {
            newExpanded.delete(lessonId);
        } else {
            newExpanded.add(lessonId);
        }
        setExpandedLessons(newExpanded);
    };

    const toggleWord = (wordId: string) => {
        const newSelected = new Set(selectedWords);
        if (newSelected.has(wordId)) {
            newSelected.delete(wordId);
        } else {
            newSelected.add(wordId);
        }
        setSelectedWords(newSelected);
    };

    const toggleAllWordsInLesson = (lesson: ILesson) => {
        if (!lesson.words) {
            return;
        }

        const lessonWordIds = lesson.words.map((w) => w.id);
        const allSelected = lessonWordIds.every((id) => selectedWords.has(id));

        const newSelected = new Set(selectedWords);
        if (allSelected) {
            lessonWordIds.forEach((id) => newSelected.delete(id));
        } else {
            lessonWordIds.forEach((id) => newSelected.add(id));
        }
        setSelectedWords(newSelected);
    };

    const selectAllWords = () => {
        const allWordIds = new Set(allWords.map((w) => w.id));
        setSelectedWords(allWordIds);
    };

    const deselectAllWords = () => {
        setSelectedWords(new Set());
    };

    const handlePlayAudio = (audioUrl: string | undefined, e: React.MouseEvent) => {
        e.stopPropagation();
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play().catch(console.error);
        }
    };

    const handleStartPractice = () => {
        if (selectedWords.size > 0) {
            const wordIds = Array.from(selectedWords).join(",");
            router.push(`/learn/practice?courseId=${id}&courseName=${course.name}&wordIds=${wordIds}`);
        }
    };

    const handlePracticeDueWords = () => {
        if (!dueWordIds || dueWordIds.wordIds.length === 0) {
            toast.info("No words are due for review right now!");
            return;
        }

        const wordIds = dueWordIds.wordIds.join(",");
        router.push(`/learn/practice?courseId=${id}&courseName=${course.name}&wordIds=${wordIds}`);
    };

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-5xl">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => router.push('/learn')}
                    className="mb-4 sm:mb-6 text-sm sm:text-base"
                    size="sm"
                >
                    <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    All Courses
                </Button>

                {/* Course Header */}
                <div className="bg-card rounded-xl sm:rounded-2xl shadow-sm overflow-hidden border border-border mb-6 sm:mb-8">
                    {course.coverImageUrl && (
                        <div className="relative h-48 sm:h-64 w-full">
                            <Image
                                src={course.coverImageUrl}
                                alt={course.name}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                                    {course.name}
                                </h1>
                                <div className="flex items-center gap-3 sm:gap-4 text-white/90 text-sm sm:text-base">
                                    <span className="flex items-center gap-1.5">
                                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        {lessons.length} lessons
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                        {totalWords} words
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Word Progress Stats */}
                <LearningProgressSection
                    stats={course.wordProgressStats}
                    className="mb-6 sm:mb-8"
                />

                {/* Selection Actions */}
                {totalWords > 0 && (
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center justify-between mb-4 sm:mb-6">
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={selectAllWords}
                                className="text-xs sm:text-sm"
                            >
                                Select All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={deselectAllWords}
                                disabled={selectedWords.size === 0}
                                className="text-xs sm:text-sm"
                            >
                                Clear Selection
                            </Button>
                            {selectedWords.size > 0 && (
                                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold">
                                    {selectedWords.size} selected
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={handlePracticeDueWords}
                                disabled={isDueWordIdsLoading || !dueWordIds || dueWordIds.wordIds.length === 0}
                                className="border-2 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10 text-xs sm:text-sm flex-1 sm:flex-initial"
                                size="sm"
                            >
                                <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                                {isDueWordIdsLoading
                                    ? "Loading..."
                                    : dueWordIds && dueWordIds.wordIds.length > 0
                                        ? `Review Due (${dueWordIds.wordIds.length})`
                                        : "No Due Words"
                                }
                            </Button>
                            <Button
                                onClick={handleStartPractice}
                                disabled={selectedWords.size === 0}
                                className="text-xs sm:text-sm flex-1 sm:flex-initial"
                                size="sm"
                            >
                                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                                Practice Selected
                            </Button>
                        </div>
                    </div>
                )}

                {/* Expandable Lessons List */}
                <div className="space-y-2 sm:space-y-3">
                    {lessons.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-muted/30">
                            <p className="text-sm sm:text-base text-muted-foreground">No lessons yet</p>
                        </div>
                    ) : (
                        lessons.map((lesson, index) => {
                            const isExpanded = expandedLessons.has(lesson.id);
                            const lessonWords = lesson.words || [];
                            const lessonWordIds = lessonWords.map((w) => w.id);
                            const allLessonWordsSelected = lessonWordIds.length > 0 && lessonWordIds.every((id) => selectedWords.has(id));
                            const someLessonWordsSelected = lessonWordIds.some((id) => selectedWords.has(id)) && !allLessonWordsSelected;

                            return (
                                <div
                                    key={lesson.id}
                                    className="bg-card border-2 border-border rounded-xl overflow-hidden transition-all hover:border-primary/50"
                                >
                                    {/* Lesson Header */}
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer"
                                        onClick={() => toggleLesson(lesson.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                toggleLesson(lesson.id);
                                            }
                                        }}
                                    >
                                        <button
                                            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleLesson(lesson.id);
                                            }}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                                            )}
                                        </button>

                                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                            {lesson.coverImageUrl ? (
                                                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                                    <Image
                                                        src={lesson.coverImageUrl}
                                                        alt={lesson.name}
                                                        width={48}
                                                        height={48}
                                                        className="object-cover w-full h-full"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary font-semibold flex-shrink-0 text-sm sm:text-base">
                                                    {index + 1}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-base sm:text-lg truncate">{lesson.name}</h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground">
                                                    {lessonWords.length} words
                                                </p>
                                                {/* Lesson word-progress stats */}
                                                {lesson.wordProgressStats && lessonWords.length > 0 && (
                                                    <WordProgressStatsInline
                                                        stats={lesson.wordProgressStats}
                                                        totalWords={lessonWords.length}
                                                        className="mt-1.5"
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {lessonWords.length > 0 && (
                                            <Checkbox
                                                checked={allLessonWordsSelected}
                                                onCheckedChange={() => toggleAllWordsInLesson(lesson)}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`flex-shrink-0 ${someLessonWordsSelected ? "data-[state=checked]:bg-primary/50" : ""}`}
                                            />
                                        )}
                                    </div>

                                    {/* Words List */}
                                    {isExpanded && lessonWords.length > 0 && (
                                        <div className="border-t border-border bg-muted/30 p-3 sm:p-4 space-y-2">
                                            {lessonWords.map((word) => (
                                                <div
                                                    key={word.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                                                    onClick={() => toggleWord(word.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            toggleWord(word.id);
                                                        }
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={selectedWords.has(word.id)}
                                                        onCheckedChange={() => toggleWord(word.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-shrink-0"
                                                    />

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                            <span className="font-semibold text-sm sm:text-base break-words">{word.word}</span>
                                                            {word.partOfSpeech && (
                                                                <span className="text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                                                                    {word.partOfSpeech}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                                            {word.meaning}
                                                        </p>
                                                        {word.pronunciation && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 break-all">
                                                                {word.pronunciation}
                                                            </p>
                                                        )}
                                                        {word.wordProgress && (
                                                            <WordProgressBadge
                                                                progress={word.wordProgress}
                                                                className="mt-1.5"
                                                            />
                                                        )}
                                                    </div>

                                                    {word.audioUrl && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => handlePlayAudio(word.audioUrl, e)}
                                                            className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                                                        >
                                                            <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {isExpanded && lessonWords.length === 0 && (
                                        <div className="border-t border-border bg-muted/30 p-4 sm:p-6 text-center">
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                No words in this lesson yet
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </main>
    );
}
