"use client";

import { WordslyMark } from "@/components/common/app-nav/wordsly-mark";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import Link from "next/link";

/** The top bar for signed-out visitors: the brand and a way in. */
export function PublicHeader() {
    return (
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 pt-safe backdrop-blur-xl">
            <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link
                    href="/"
                    className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <WordslyMark />
                    <span className="font-display text-xl font-extrabold tracking-tight text-gradient-brand">
                        Wordsly
                    </span>
                </Link>
                <Button asChild variant="play" size="default" className="h-10 gap-2 px-4">
                    <Link href="/auth/login">
                        <LogIn className="h-4 w-4" aria-hidden />
                        Log in
                    </Link>
                </Button>
            </div>
        </header>
    );
}
