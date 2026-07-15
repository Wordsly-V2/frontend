import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
    title: "Offline · Wordsly",
};

export default function OfflinePage() {
    return (
        <main className="mesh-page-bg flex min-h-dvh flex-col items-center justify-center px-6 text-center">
            <div className="glass-surface flex max-w-sm flex-col items-center gap-4 rounded-3xl p-8">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <WifiOff className="h-8 w-8" aria-hidden />
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    You&rsquo;re offline
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Wordsly needs a connection to load new words. Check your internet and
                    try again — your progress is safe.
                </p>
            </div>
        </main>
    );
}
