"use client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Suspense } from "react";
import RedirectContent from "./redirect-content";

export default function RedirectPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-dvh bg-slate-50 flex items-center justify-center px-4">
                    <LoadingSpinner size="lg" />
                </main>
            }
        >
            <RedirectContent />
        </Suspense>
    );
}