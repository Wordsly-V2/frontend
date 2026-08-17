import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 pb-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-brand text-primary-foreground shadow-md">
                <Compass className="h-10 w-10" aria-hidden />
            </div>
            <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold tracking-tight">
                    This page moved on
                </h1>
                <p className="mx-auto max-w-sm text-balance text-muted-foreground">
                    We couldn&apos;t find that page. Your words are all still here.
                </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button variant="play" asChild>
                    <Link href="/learn">Go to Learn</Link>
                </Button>
                <Button variant="playOutline" asChild>
                    <Link href="/learn/courses">Browse courses</Link>
                </Button>
            </div>
        </main>
    );
}
