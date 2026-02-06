"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Settings, GraduationCap, Sparkles } from "lucide-react";

export default function HomePage() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-4xl">
                {/* Hero Section */}
                <div className="text-center mb-12 sm:mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl gradient-brand mb-4 sm:mb-6">
                        <GraduationCap className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent px-4">
                        Welcome to Wordsly
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 px-4">
                        Your personal English learning companion
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                        <Button
                            size="lg"
                            onClick={() => router.push('/learn')}
                            className="text-base sm:text-lg h-11 sm:h-12 px-6 sm:px-8 w-full sm:w-auto"
                        >
                            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Start Learning
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => router.push('/manage')}
                            className="text-base sm:text-lg h-11 sm:h-12 px-6 sm:px-8 w-full sm:w-auto"
                        >
                            <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Manage Courses
                        </Button>
                    </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
                    <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg gradient-brand flex items-center justify-center mb-3 sm:mb-4">
                            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Learn Mode</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Practice vocabulary with interactive flashcards, track your progress, and master new words.
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg gradient-accent flex items-center justify-center mb-3 sm:mb-4">
                            <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Manage Mode</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Create, edit, and organize your courses, lessons, and vocabulary all in one place.
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3 sm:mb-4">
                            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Smart Practice</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Flashcard-based learning with audio support and self-assessment tracking.
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-3 sm:mb-4">
                            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">CEFR Aligned</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Content organized by proficiency levels from A2 to C1 for structured learning.
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="text-center text-muted-foreground px-4">
                    <p className="text-xs sm:text-sm">
                        Ready to start? Choose your mode above to begin your English learning journey!
                    </p>
                </div>
            </div>
        </main>
    );
}
