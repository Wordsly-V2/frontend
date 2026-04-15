"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/useUser.hook";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function LoginContent() {
  const router = useRouter();
  const { profile, isLoading } = useUser();
  const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;

  useEffect(() => {
    if (!isLoading && profile) {
      router.replace("/profile");
    }
  }, [profile, isLoading, router]);

  if (isLoading || profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-brand mb-4 shadow-lg shadow-primary/25">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
            Wordsly
          </h1>
          <p className="text-muted-foreground">
            Sign in to sync your courses and progress
          </p>
        </div>

        <Card className="border-border/80 shadow-xl shadow-primary/5 bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              Sign In
            </CardTitle>
            <CardDescription className="text-center">
              Use your Google account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a
              href={googleAuthUrl}
              className="w-full h-12 text-base font-medium rounded-xl border border-border/90 bg-background/80 hover:border-primary/40 hover:bg-primary/5 transition-colors duration-200 group inline-flex items-center justify-center gap-2"
            >
              <svg
                className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors"
                aria-hidden="true"
                focusable="false"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
                aria-label="Google logo"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Sign in with Google
            </a>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
