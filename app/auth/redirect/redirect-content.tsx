"use client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function RedirectContent() {
    const searchParams = useSearchParams();
    const accessToken = searchParams.get("access_token");
    const errorParam = searchParams.get("error");
    const redirectPath = searchParams.get("redirect") || "/learn";

    useEffect(() => {
        if (errorParam) {
            return;
        }

        if (!accessToken) {
            return;
        }

        localStorage.setItem("access_token", accessToken);
        redirect(redirectPath);
    }, [accessToken, errorParam, redirectPath]);

    if (errorParam) {
        return (
            <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
                <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg animate-fade-up">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">
                                Unable to Sign In
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                An error occurred during authentication.
                            </p>
                        </div>
                    </div>
                    <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {errorParam}
                    </p>
                    <div className="mt-6 flex items-center justify-between gap-3 text-sm">
                        <Link
                            href="/auth/login"
                            className="rounded-lg gradient-brand px-4 py-2 text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
                        >
                            Back to Login
                        </Link>
                        <span className="text-muted-foreground text-xs">Error may be temporary</span>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
            <div className="text-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-muted-foreground animate-pulse">
                    Redirecting you...
                </p>
            </div>
        </main>
    );
}