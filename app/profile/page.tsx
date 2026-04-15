"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useUser } from "@/hooks/useUser.hook";
import { Info } from "lucide-react";

export default function ProfilePage() {
    const { profile: userProfile, isLoading, error, fetchProfile } = useUser();

    if (isLoading) {
        return (
            <main className="flex min-h-dvh items-center justify-center px-4">
                <LoadingSpinner size="lg" label="Loading profile…" />
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
                <p className="text-muted-foreground">Error: {error}</p>
                <Button onClick={() => fetchProfile()}>Try again</Button>
            </main>
        );
    }

    return (
        <div className="min-h-dvh px-4 pb-12 pt-8 md:px-8 md:pt-12">
            <div className="mx-auto max-w-2xl space-y-8">
                <div className="space-y-1 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Account
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                    <p className="text-muted-foreground">Details from your Google account</p>
                </div>

                <Card className="border-border/80 shadow-lg shadow-primary/5">
                    <CardContent className="pt-8">
                        <div className="flex flex-col items-center space-y-5">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-[var(--brand-accent)]/30 blur-xl" />
                                <div className="relative overflow-hidden rounded-full border-4 border-background shadow-xl">
                                    <Avatar className="h-32 w-32">
                                        <AvatarImage
                                            src={userProfile?.pictureUrl ?? ""}
                                            alt={userProfile?.displayName ?? ""}
                                            loading="lazy"
                                            crossOrigin="anonymous"
                                            referrerPolicy="no-referrer"
                                        />
                                        <AvatarFallback className="text-2xl">
                                            {userProfile?.displayName?.charAt(0) ?? ""}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold">{userProfile?.displayName ?? ""}</h2>
                                <p className="mt-1 text-sm text-muted-foreground">{userProfile?.gmail ?? ""}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/80 shadow-md">
                    <CardHeader>
                        <CardTitle>Account details</CardTitle>
                        <CardDescription>Synced from Google — read only in Wordsly</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                Display name
                            </Label>
                            <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                                <p className="font-medium text-foreground">{userProfile?.displayName ?? ""}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                Email
                            </Label>
                            <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                                <p className="font-medium text-foreground">{userProfile?.gmail ?? ""}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 dark:bg-primary/10">
                            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                            <div className="space-y-1 text-sm">
                                <p className="font-medium text-foreground">Read-only info</p>
                                <p className="text-muted-foreground leading-relaxed">
                                    This data comes from your Google account. To change it, update your Google
                                    profile, then sign in again.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
