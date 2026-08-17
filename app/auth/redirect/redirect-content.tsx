"use client";
import { ACCESS_TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY, setLocalStorageItem } from "@/lib/local-storage";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    clearAuthRedirect,
    consumeAuthRedirect,
    sanitizeRedirectPath,
} from "@/lib/auth-redirect";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function RedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const accessToken = searchParams.get("access_token");
    // Present only when the backend runs in 'body' refresh-token delivery mode.
    const refreshToken = searchParams.get("refresh_token");
    const errorParam = searchParams.get("error");
    const redirectParam = searchParams.get("redirect");

    useEffect(() => {
        if (errorParam) {
            // Nothing to come back to — don't strand a stale destination for the
            // next sign-in attempt.
            clearAuthRedirect();
            return;
        }

        if (!accessToken) {
            return;
        }

        setLocalStorageItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
        if (refreshToken) {
            setLocalStorageItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
        }

        // The gateway does not forward `?redirect=` through the OAuth hop, so the
        // parked value is the usual source; the param wins when it survives.
        const target = sanitizeRedirectPath(
            redirectParam ?? consumeAuthRedirect(),
        );
        clearAuthRedirect();
        // `replace`: this callback URL carries the access token in its query
        // string. Leaving it in history means Back re-runs the handoff and the
        // token stays one keypress away in the address bar.
        router.replace(target);
    }, [accessToken, refreshToken, errorParam, redirectParam, router]);

    if (errorParam) {
        return (
            <main className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
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
        <main className="min-h-dvh flex items-center justify-center px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
            <div className="text-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-muted-foreground animate-pulse">
                    Redirecting you...
                </p>
            </div>
        </main>
    );
}