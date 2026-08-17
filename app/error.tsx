"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level crash boundary. Without one, a render error anywhere under `/`
 * takes the whole app to Next's blank error screen with no way back into the
 * router — `reset()` re-renders the failed segment in place instead.
 */
export default function RouteError({
    error,
    reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 pb-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/15 text-destructive">
                <TriangleAlert className="h-10 w-10" aria-hidden />
            </div>
            <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold tracking-tight">
                    Something went wrong
                </h1>
                <p className="mx-auto max-w-sm text-balance text-muted-foreground">
                    That&apos;s on us, not on you. Nothing you practiced was lost.
                </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="play" onClick={reset} className="gap-2">
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Try again
                </Button>
                <Button variant="playOutline" asChild>
                    <Link href="/learn">Go to Learn</Link>
                </Button>
            </div>
        </main>
    );
}
